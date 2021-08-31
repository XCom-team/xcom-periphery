// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract RewardDistributionRecipient is
    Initializable,
    OwnableUpgradeable
{
    address rewardDistribution;

    function _initialize(address _rewardDistribution) public initializer {
        OwnableUpgradeable.__Ownable_init();
        rewardDistribution = _rewardDistribution;
    }

    modifier onlyRewardDistribution() {
        require(
            _msgSender() == rewardDistribution,
            "Caller is not reward distribution"
        );
        _;
    }

    function setRewardDistribution(address _rewardDistribution)
        external
        onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }
}
