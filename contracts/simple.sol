// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;
contract SimpleContract {
    string public storeName;
    function setName(string memory _name) public {
        storeName = _name;
    }
    function getName() public view returns (string memory) {
        return storeName;
    }
}
