// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VehicleService {

    address public admin;

    enum Status {
        RequestCreated, AcceptedByAdmin, VehicleArrived, Inspected,
        DepositPaid, WorkInProgress, ReadyForPickup, Finalized, Rejected, Cancelled
    }

    struct RepairJob {
        uint256 id;
        string vin;
        address client;
        Status status;
        uint256 estimatedTotal;
        uint256 depositRequired;
        string cancelReason;
        string requestPdfHash;
        string inspectionPdfHash;
        string workReportPdfHash;
        string receiptPdfHash;
    }

    mapping(string => address) public vehicleOwners;
    mapping(string => string) public vehiclePassportHashes;
    mapping(uint256 => RepairJob) public repairJobs;
    uint256 public jobCounter;

    event StatusChanged(uint256 indexed jobId, Status newStatus, string reason);
    event VehicleRegistered(string indexed vin, address indexed owner);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyClient(uint256 _jobId) {
        require(repairJobs[_jobId].client == msg.sender, "Only owner can do this");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerVehicle(string memory _vin, string memory _passportHash) public {
        require(vehicleOwners[_vin] == address(0), "Already registered");
        vehicleOwners[_vin] = msg.sender;
        vehiclePassportHashes[_vin] = _passportHash;
        emit VehicleRegistered(_vin, msg.sender);
    }


    function createRequest(string memory _vin, string memory _requestPdfHash) public returns (uint256) {
        require(vehicleOwners[_vin] == msg.sender, "Not your vehicle");
        jobCounter++;
        RepairJob storage newJob = repairJobs[jobCounter];
        newJob.id = jobCounter;
        newJob.vin = _vin;
        newJob.client = msg.sender;
        newJob.status = Status.RequestCreated;
        newJob.requestPdfHash = _requestPdfHash;
        emit StatusChanged(jobCounter, Status.RequestCreated, "");
        return jobCounter;
    }

    function adminApprove(uint256 _jobId) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.RequestCreated, "Wrong status");
        repairJobs[_jobId].status = Status.AcceptedByAdmin;
        emit StatusChanged(_jobId, Status.AcceptedByAdmin, "");
    }

    function markArrival(uint256 _jobId) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.AcceptedByAdmin, "Not approved");
        repairJobs[_jobId].status = Status.VehicleArrived;
        emit StatusChanged(_jobId, Status.VehicleArrived, "");
    }

    function setInspectionResult(uint256 _jobId, uint256 _total, uint256 _deposit, string memory _inspectionHash) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.VehicleArrived, "Not at station");
        RepairJob storage job = repairJobs[_jobId];
        job.estimatedTotal = _total;
        job.depositRequired = _deposit;
        job.inspectionPdfHash = _inspectionHash;
        job.status = Status.Inspected;
        emit StatusChanged(_jobId, Status.Inspected, "");
    }

    function confirmDeposit(uint256 _jobId) public onlyClient(_jobId) {
        require(repairJobs[_jobId].status == Status.Inspected, "Not inspected");
        repairJobs[_jobId].status = Status.DepositPaid;
        emit StatusChanged(_jobId, Status.DepositPaid, "");
    }

    function completeRepair(uint256 _jobId, string memory _workReportHash, uint256 _finalTotal) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.WorkInProgress, "Repair not started");

        RepairJob storage job = repairJobs[_jobId];
        job.status = Status.ReadyForPickup;
        job.workReportPdfHash = _workReportHash;
        job.estimatedTotal = _finalTotal;

        emit StatusChanged(_jobId, Status.ReadyForPickup, "Repair finished. Final price updated.");
    }
    function finalizeJob(uint256 _jobId, string memory _receiptHash) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.ReadyForPickup, "Not ready");
        repairJobs[_jobId].status = Status.Finalized;
        repairJobs[_jobId].receiptPdfHash = _receiptHash;
        emit StatusChanged(_jobId, Status.Finalized, "");
    }

    function rejectRequest(uint256 _jobId, string memory _reason) public onlyAdmin {
        repairJobs[_jobId].status = Status.Rejected;
        repairJobs[_jobId].cancelReason = _reason;
        emit StatusChanged(_jobId, Status.Rejected, _reason);
    }

    function cancelRequest(uint256 _jobId, string memory _reason) public onlyClient(_jobId) {
        require(uint(repairJobs[_jobId].status) < 5, "Repair in progress");
        repairJobs[_jobId].status = Status.Cancelled;
        repairJobs[_jobId].cancelReason = _reason;
        emit StatusChanged(_jobId, Status.Cancelled, _reason);
    }

    function getJob(uint256 _jobId) public view returns (RepairJob memory) {
        return repairJobs[_jobId];
    }
    function confirmDepositPaid(uint256 _jobId, string memory _receiptHash) external onlyAdmin {
        RepairJob storage job = repairJobs[_jobId];

        require(job.status == Status.Inspected, "Job must be in Inspected status");

        job.status = Status.DepositPaid;
        job.receiptPdfHash = _receiptHash;

        emit StatusChanged(_jobId, Status.DepositPaid, "Manual payment confirmed by admin");
    }
    function payDepositOnline(uint256 _jobId, string memory _receiptHash) external onlyAdmin {
        RepairJob storage job = repairJobs[_jobId];
        require(job.status == Status.Inspected, "Status must be Inspected");

        job.status = Status.DepositPaid;
        job.receiptPdfHash = _receiptHash;

        emit StatusChanged(_jobId, Status.DepositPaid, "Online payment confirmed");
    }
    function startRepair(uint256 _jobId) public onlyAdmin {
        require(repairJobs[_jobId].status == Status.DepositPaid, "Deposit not paid yet");

        repairJobs[_jobId].status = Status.WorkInProgress;

        emit StatusChanged(_jobId, Status.WorkInProgress, "Mechanic started working on the vehicle");
    }
}