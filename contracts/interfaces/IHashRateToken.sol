// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

interface IHashRateToken is IERC20MetadataUpgradeable {
    function mint(address to, uint256 amount) external;
}
