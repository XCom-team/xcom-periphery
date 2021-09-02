// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "./LockTokenSnapshot.sol";
import "./RewardDistributionRecipient.sol";
import "../aave/ILendingPool.sol";

contract RewardPool is
    Initializable,
    LockTokenSnapshot,
    RewardDistributionRecipient
{
    using SafeMathUpgradeable for uint256;
    using AddressUpgradeable for address;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    string public name;
    IERC20Upgradeable public rewardToken;
    uint256 public duration; // making it not a constant is less gas efficient, but portable
    uint256 public periodFinish = 0;
    uint256 public rewardRate = 0;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => bool) smartContractStakers;
    uint256 constant delayDuration = 24 * 60 * 60;
    address public adminWithdraw;
    uint256 public budgetTotal = 0;
    address public lendingPool;

    event RewardAdded(
        uint256 reward,
        uint256 indexed rawardrate,
        uint256 budget
    );
    event RewardChange(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event WithdrawApplied(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardDenied(address indexed user, uint256 reward);
    event SmartContractRecorded(
        address indexed smartContractAddress,
        address indexed smartContractInitiator
    );

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function initialize(
        string memory _name,
        address _rewardToken,
        address _lockToken,
        address _lendingPool,
        uint256 _duration
    ) public {
        _initialize(_name, _rewardToken, _lockToken, _lendingPool, _duration);
    }

    function _initialize(
        string memory _name,
        address _rewardToken,
        address _lockToken,
        address _lendingPool,
        uint256 _duration
    ) internal initializer {
        __RewardDistributionRecipient_init(msg.sender);
        __LockTokenWrapper_init(_lockToken);
        name = _name;
        rewardToken = IERC20Upgradeable(_rewardToken);
        duration = _duration;
        lendingPool = _lendingPool;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return MathUpgradeable.min(block.timestamp, periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupplyInertal() == 0) {
            return rewardPerTokenStored;
        }
        if (budgetTotal == 0) {
            return 0;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(budgetTotal)
            );
    }

    function earned(address account) public view returns (uint256) {
        return
            _balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    // stake visibility is public as overriding LockTokenWrapper's stake() function
    function stake(uint256 amount) public override updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        recordSmartContract();

        _beforeTokenTransfer(msg.sender);

        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        _beforeTokenTransfer(msg.sender);
        _withdraw(fixAmount(amount));
        emit Withdrawn(msg.sender, amount);
    }

    function exit() external {
        withdraw(balanceOf(msg.sender));
        getReward();
    }

    function fixAmount(uint256 amount) private view returns (uint256) {
        uint256 b = balanceOf(msg.sender);
        require(b > 0, "balance is 0");
        return amount > b ? b : amount;
    }

    /// A push mechanism for accounts that have not claimed their rewards for a long time.
    /// The implementation is semantically analogous to getReward(), but uses a push pattern
    /// instead of pull pattern.
    function pushReward(address recipient)
        public
        updateReward(recipient)
        onlyOwner
    {
        uint256 reward = earned(recipient);
        if (reward > 0) {
            rewards[recipient] = 0;
            rewardToken.safeTransfer(recipient, reward);
            emit RewardPaid(recipient, reward);
        }
    }

    function updateLendingPool(address newPool) external {
        //require(newPool != address(0), "invalid address");
        lendingPool = newPool;
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function getRewardAndStake() public updateReward(msg.sender) {
        require(lendingPool != address(0), "invalid LendingPool address");
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewards[msg.sender] = 0;
            ILendingPool(lendingPool).deposit(
                address(rewardToken),
                reward,
                msg.sender,
                0
            );
            emit RewardPaid(msg.sender, reward);
        }
    }

    function setDuration(uint256 period) external onlyRewardDistribution {
        duration = period;
    }

    function addRewardAmount(uint256 reward, uint256 budget)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        require(
            reward < type(uint256).max / 1e18,
            "the notified reward cannot invoke multiplication overflow"
        );
        require(budget > 0, "need set total power token");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(duration);
            periodFinish = block.timestamp.add(duration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            uint256 leftover = rewardRate.mul(remaining);
            rewardRate = reward.add(leftover).div(duration.add(remaining));
            periodFinish = block.timestamp.add(duration).add(remaining);
        }

        lastUpdateTime = block.timestamp;
        budgetTotal = budget;

        emit RewardAdded(reward, rewardRate, budget);
    }

    function changeRewardAmount(uint256 reward, uint256 budget)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        require(
            reward < type(uint256).max / 1e18,
            "the notified reward cannot invoke multiplication overflow"
        );
        require(budget > 0, "need set total power token");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward.div(duration);
            periodFinish = block.timestamp.add(duration);
        } else {
            uint256 remaining = periodFinish.sub(block.timestamp);
            rewardRate = reward.div(remaining);
        }

        lastUpdateTime = block.timestamp;
        budgetTotal = budget;
        emit RewardChange(reward);
    }

    function recovery(uint256 value) external onlyRewardDistribution {
        rewardToken.safeTransfer(rewardDistribution, value);
    }

    // Harvest Smart Contract recording
    function recordSmartContract() internal {
        if (tx.origin != msg.sender) {
            smartContractStakers[msg.sender] = true;
            emit SmartContractRecorded(msg.sender, tx.origin);
        }
    }

    /*function setWithdrawAdmin(address account) public onlyOwner {
        adminWithdraw = account;
    }

    function withdrawAdmin(uint256 amount) external onlyOwner {
        require(
            adminWithdraw != address(0),
            "Please set withdraw admin account first"
        );
        require(totalSupplyInertal() > 0, "total supply is 0!");
        require(
            amount <= totalSupply().div(2),
            "admin withdraw amount must be less than half of total supply!"
        );
        _withdrawAdmin(adminWithdraw, amount);
        emit Withdrawn(adminWithdraw, amount);
    }*/

    function snapshot() external onlyOwner returns (uint256) {
        return _snapshot();
    }
}
