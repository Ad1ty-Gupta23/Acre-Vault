// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract LandRegistry {
    struct LandRecord {
        uint256 id;
        string owner;
        string surveyNo;
        uint256 area;
        bool isVerified;
    }
    
    mapping(uint256 => LandRecord) public lands;
    uint256 public landCount;

    event LandRegistered(uint256 id, string owner, string surveyNo, uint256 area);
    event OwnershipTransferred(uint256 id, string newOwner);
    event LandVerified(uint256 id);

    function registerLand(string memory _owner, string memory _surveyNo, uint256 _area) public {
        landCount++;
        lands[landCount] = LandRecord(landCount, _owner, _surveyNo, _area, false);
        emit LandRegistered(landCount, _owner, _surveyNo, _area);
    }

    function transferOwnership(uint256 _landId, string memory _newOwner) public {
        require(lands[_landId].id != 0, "Land does not exist");
        lands[_landId].owner = _newOwner;
        emit OwnershipTransferred(_landId, _newOwner);
    }

    function verifyLand(uint256 _landId) public {
        require(lands[_landId].id != 0, "Land does not exist");
        lands[_landId].isVerified = true;
        emit LandVerified(_landId);
    }
}
