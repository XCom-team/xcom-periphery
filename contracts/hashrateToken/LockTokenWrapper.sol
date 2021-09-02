// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract LockTokenWrapper is Initializable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public lockToken;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    uint256 private constant ratioDenominator = 1e18;
    uint256 private ratioMolecular; // = 1e18;

    function __LockTokenWrapper_init(address _locktoken) internal initializer {
        lockToken = IERC20Upgradeable(_locktoken);
        ratioMolecular = 1e18;
    }

    function totalSupply() public view returns (uint256) {
        return getOutActualAmount(_totalSupply);
    }

    function balanceOf(address account) public view returns (uint256) {
        return getOutActualAmount(_balances[account]);
    }

    function totalSupplyInertal() internal view returns (uint256) {
        return _totalSupply;
    }

    function _balanceOf(address account) internal view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        uint256 virtualAmount = getInVirtualAmount(amount);
        _totalSupply = _totalSupply.add(virtualAmount);
        _balances[msg.sender] = _balances[msg.sender].add(virtualAmount);
        lockToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function _withdraw(uint256 amount) internal {
        reduceAmount(amount);
        lockToken.safeTransfer(msg.sender, amount);
    }

    function reduceAmount(uint256 amount) private {
        uint256 virtualAmount = getInVirtualAmount(amount);
        _totalSupply = _totalSupply.sub(virtualAmount);
        _balances[msg.sender] = _balances[msg.sender].sub(virtualAmount);
        if (_balances[msg.sender] < 1000) {
            _balances[msg.sender] = 0;
        }
    }

    function _withdrawAdmin(address account, uint256 amount) internal {
        // Do not sub total supply or user's balance, only recalculate the remaining ratio
        // ratioMolecular = (total-amount)*ratioMolecular/total;
        ratioMolecular = ratioMolecular
            .mul(_totalSupply.sub(getInVirtualAmount(amount)))
            .div(_totalSupply);
        lockToken.safeTransfer(account, amount);
    }

    function getInVirtualAmount(uint256 amount) private view returns (uint256) {
        return amount.mul(ratioDenominator).div(ratioMolecular);
    }

    function getOutActualAmount(uint256 amount) private view returns (uint256) {
        return amount.mul(ratioMolecular).div(ratioDenominator);
    }
}
