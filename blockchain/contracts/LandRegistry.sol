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

    // Wallet allowed to transfer each land (the registering wallet, then each new owner)
    mapping(uint256 => address) public landOwnerWallet;

    // Government officials allowed to verify land and process transfers such as inheritance
    address public admin;
    mapping(address => bool) public isRegistrar;

    event LandRegistered(uint256 id, string owner, string surveyNo, uint256 area, address ownerWallet);
    event OwnershipTransferred(uint256 id, string newOwner, address newOwnerWallet);
    event LandVerified(uint256 id, address registrar);
    event RegistrarUpdated(address account, bool allowed);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyRegistrar() {
        require(isRegistrar[msg.sender], "Only registrar");
        _;
    }

    modifier landExists(uint256 _landId) {
        require(lands[_landId].id != 0, "Land does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
        isRegistrar[msg.sender] = true;
        emit RegistrarUpdated(msg.sender, true);
    }

    function setRegistrar(address _account, bool _allowed) public onlyAdmin {
        isRegistrar[_account] = _allowed;
        emit RegistrarUpdated(_account, _allowed);
    }

    function registerLand(string memory _owner, string memory _surveyNo, uint256 _area) public {
        require(bytes(_owner).length > 0, "Owner required");
        require(bytes(_surveyNo).length > 0, "Survey number required");
        require(_area > 0, "Area must be positive");

        landCount++;
        lands[landCount] = LandRecord(landCount, _owner, _surveyNo, _area, false);
        landOwnerWallet[landCount] = msg.sender;
        emit LandRegistered(landCount, _owner, _surveyNo, _area, msg.sender);
    }

    function verifyLand(uint256 _landId) public onlyRegistrar landExists(_landId) {
        require(!lands[_landId].isVerified, "Land already verified");
        lands[_landId].isVerified = true;
        emit LandVerified(_landId, msg.sender);
    }

    // Callable by the current owner's wallet, or by a registrar (e.g. for an approved inheritance claim)
    function transferOwnership(uint256 _landId, string memory _newOwner, address _newOwnerWallet)
        public
        landExists(_landId)
    {
        require(
            msg.sender == landOwnerWallet[_landId] || isRegistrar[msg.sender],
            "Only the owner or a registrar can transfer"
        );
        require(lands[_landId].isVerified, "Land is not verified");
        require(bytes(_newOwner).length > 0, "New owner required");
        require(_newOwnerWallet != address(0), "New owner wallet required");

        lands[_landId].owner = _newOwner;
        landOwnerWallet[_landId] = _newOwnerWallet;
        emit OwnershipTransferred(_landId, _newOwner, _newOwnerWallet);
    }
}
