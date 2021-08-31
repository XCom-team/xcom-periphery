// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../interfaces/IHashRateToken.sol";

contract HashRateStore is Initializable, OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IHashRateToken;

    string public name;
    address public recipient;
    IHashRateToken public tokenHashRate;
    IHashRateToken public tokenSpread;
    IERC20Upgradeable public tokenUnderlying;

    //budget
    uint256 private budgetHashrate; //1 hashrate
    uint256 private budgetSpread; //0.01 hashrate

    //state
    uint256 public priceHashRate;
    uint256 public reserveHashRate;
    uint8 public percentSpread;
    bool public paused;

    //append
    address public rewardPoolHashRate;
    address public rewardPoolSpread;

    address public administrator;

    modifier onlyAdmin() {
        require(
            owner() == msg.sender || administrator == msg.sender,
            "onlyAdmin: caller is not the admin"
        );
        _;
    }

    event newAdmin(address indexed admin);
    event buy(
        address indexed buyer,
        uint256 indexed number,
        uint256 amount,
        address referral,
        uint256 spreadAmount
    );
    event mint(address indexed to, uint256 number);
    event UpdateSupply(uint256 last, uint256 current);
    event UpdatePercent(uint256 last, uint256 current);
    event UpdatePrice(uint256 last, uint256 current);

    function initialize(
        address _recipient,
        address _hashRate,
        address _spread,
        address _underlying,
        uint256 _budget,
        uint256 _price,
        uint8 _percent
    ) public initializer {
        require(
            _recipient != address(0) &&
                _hashRate != address(0) &&
                _underlying != address(0) &&
                _price != 0,
            "invalid parameter"
        );
        recipient = _recipient;
        tokenHashRate = IHashRateToken(_hashRate);
        tokenSpread = IHashRateToken(_spread);
        tokenUnderlying = IERC20Upgradeable(_underlying);

        require(_budget >= _solded(), "invalid budget");
        budgetHashrate = _budget;
        budgetSpread = _budget.mul(_percent);

        priceHashRate = _price;
        reserveHashRate = _budget.sub(_solded());
        percentSpread = _percent;

        administrator = msg.sender;
        paused = false;
        name = "XCom FileCoin HashRate Token Store";
        emit UpdateSupply(0, reserveHashRate);
        emit UpdatePercent(0, percentSpread);
        emit UpdatePrice(0, priceHashRate);
    }

    function _solded() internal view returns (uint256) {
        return tokenHashRate.totalSupply().div(_decimals(tokenHashRate));
    }

    function _decimals(IHashRateToken token) internal view returns (uint256) {
        return 10**token.decimals();
    }

    function setAdmin(address newOne) external onlyAdmin {
        administrator = newOne;
        emit newAdmin(newOne);
    }

    function updateRecipient(address seller) external onlyAdmin {
        require(seller != address(0), "invalid address");
        recipient = seller;
    }

    function changeUnderlying(address asset) external onlyAdmin {
        require(asset != address(0), "invalid address");
        tokenUnderlying = IERC20Upgradeable(asset);
    }

    function updatePrice(uint256 price) external onlyAdmin {
        uint256 last = priceHashRate;
        priceHashRate = price;
        emit UpdatePrice(last, priceHashRate);
    }

    function updateHashRate(address hashrate) external onlyAdmin {
        require(hashrate != address(0), "invalid address");
        tokenHashRate = IHashRateToken(hashrate);
    }

    function updateHashRatePool(address pool) external onlyAdmin {
        require(pool != address(0), "invalid address");
        rewardPoolHashRate = pool;
    }

    function updateSpreadToken(address spread) external onlyAdmin {
        tokenSpread = IHashRateToken(spread);
    }

    function updateSpreadPool(address pool) external onlyAdmin {
        if (address(tokenSpread) != address(0)) {
            require(pool != address(0), "invalid address");
        }
        rewardPoolSpread = pool;
    }

    function updateSpreadPercent(uint8 percent) external onlyAdmin {
        budgetSpread = budgetSpread.sub(reserveHashRate.mul(percentSpread)).add(
                reserveHashRate.mul(percent)
            );

        uint256 last = percentSpread;
        percentSpread = percent;
        emit UpdatePercent(last, percentSpread);
    }

    function updatePause(bool isPause) external onlyAdmin {
        paused = isPause;
    }

    function changeSupply(uint256 supply) external onlyAdmin {
        require(supply != reserveHashRate, "no change");
        if (supply > reserveHashRate) {
            budgetHashrate = budgetHashrate.add(supply.sub(reserveHashRate));
            budgetSpread = budgetSpread.add(
                supply.sub(reserveHashRate).mul(percentSpread)
            );
        } else {
            budgetHashrate = budgetHashrate.sub(reserveHashRate.sub(supply));
            budgetSpread = budgetSpread.sub(
                reserveHashRate.sub(supply).mul(percentSpread)
            );
        }

        uint256 last = reserveHashRate;
        reserveHashRate = supply;
        emit UpdateSupply(last, reserveHashRate);
    }

    function addSupply(uint256 supply) external onlyAdmin {
        uint256 last = reserveHashRate;
        reserveHashRate = reserveHashRate.add(supply);
        budgetHashrate = budgetHashrate.add(supply);
        budgetSpread = budgetSpread.add(supply.mul(percentSpread));
        emit UpdateSupply(last, reserveHashRate);
    }

    function _pay(uint256 number) internal {
        tokenUnderlying.safeTransferFrom(
            _msgSender(),
            recipient,
            priceHashRate.mul(number)
        );
    }

    function buyToken(uint256 number, address spread) external {
        require(number <= reserveHashRate, "no supply");
        require(spread != msg.sender, "invalid referral address");
        require(!paused, "It's paused");
        _pay(number);
        uint256 amount = number.mul(_decimals(tokenHashRate));
        uint256 spreadAmount = amount.mul(percentSpread).div(100);
        tokenHashRate.mint(msg.sender, amount);
        reserveHashRate = reserveHashRate.sub(number);

        address spreadRecipient = spread;
        if (spread == address(0)) {
            spreadRecipient = address(this);
        }
        tokenSpread.mint(spreadRecipient, spreadAmount);

        emit buy(
            msg.sender,
            amount,
            priceHashRate.mul(number),
            spreadRecipient,
            spreadAmount
        );
    }

    function mintHashrate(uint256 number) external onlyAdmin {
        uint256 amount = number.mul(_decimals(tokenHashRate));
        tokenHashRate.mint(msg.sender, amount);
        budgetHashrate = budgetHashrate.add(number);
        emit mint(msg.sender, number);
    }

    function getBudgetHashRate() external view returns (uint256, uint256) {
        return (budgetHashrate, budgetHashrate.mul(_decimals(tokenHashRate)));
    }

    function getBudgetSpread() external view returns (uint256, uint256) {
        return (
            budgetSpread,
            budgetSpread.mul(_decimals(tokenSpread)).div(100)
        );
    }
}
