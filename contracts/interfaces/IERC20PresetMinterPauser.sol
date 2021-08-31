// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/IAccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";

interface IERC20PresetMinterPauser is
    IAccessControlEnumerableUpgradeable,
    IERC20MetadataUpgradeable
{
    function mint(address to, uint256 amount) external;

    function pause() external;

    function unpause() external;

    function MINTER_ROLE() external view returns (bytes32);

    function PAUSER_ROLE() external view returns (bytes32);
}
