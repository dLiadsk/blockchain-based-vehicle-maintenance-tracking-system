// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title VehicleService
 * @notice Manages vehicle maintenance requests, tracking status, and storing document hashes on-chain.
 * @dev Optimized for gas using custom errors, calldata for external inputs, and packed structs.
 */
contract VehicleService {

    // ============================================================================
    // ERRORS
    // ============================================================================

    error UnauthorizedAdmin();
    error UnauthorizedClient();
    error VehicleAlreadyRegistered();
    error NotVehicleOwner();
    error InvalidJobStatus(Status current, Status required);
    error InvalidCancelState();

    // ============================================================================
    // ENUMS & STRUCTS
    // ============================================================================

    enum Status {
        RequestCreated,  // 0
        AcceptedByAdmin, // 1
        VehicleArrived,  // 2
        Inspected,       // 3
        DepositPaid,     // 4
        WorkInProgress,  // 5
        ReadyForPickup,  // 6
        Finalized,       // 7
        Cancelled        // 8
    }

    /**
     * @dev Struct is packed to optimize gas usage.
     * `client` (20 bytes) and `status` (1 byte) fit into a single 32-byte storage slot.
     */
    struct RepairJob {
        uint256 id;
        address client;
        Status status;
        uint256 estimatedTotal;
        uint256 depositRequired;
        string vin;
        string cancelReason;
        string requestPdfHash;
        string inspectionPdfHash;
        string workReportPdfHash;
        string receiptPdfHash;
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    address public immutable admin;
    uint256 public jobCounter;

    mapping(string => address) public vehicleOwners;
    mapping(string => string) public vehiclePassportHashes;
    mapping(uint256 => RepairJob) public repairJobs;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event StatusChanged(uint256 indexed jobId, Status newStatus, string reason);
    event VehicleRegistered(string indexed vin, address indexed owner);

    // ============================================================================
    // MODIFIERS
    // ============================================================================

    modifier onlyAdmin() {
        if (msg.sender != admin) revert UnauthorizedAdmin();
        _;
    }

    modifier onlyClient(uint256 _jobId) {
        if (repairJobs[_jobId].client != msg.sender) revert UnauthorizedClient();
        _;
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor() {
        admin = msg.sender;
    }

    // ============================================================================
    // EXTERNAL FUNCTIONS
    // ============================================================================

    /**
     * @notice Registers a new vehicle to the caller.
     * @param _vin The Vehicle Identification Number.
     * @param _passportHash The IPFS/SHA256 hash of the vehicle's passport document.
     */
    function registerVehicle(string calldata _vin, string calldata _passportHash) external {
        if (vehicleOwners[_vin] != address(0)) revert VehicleAlreadyRegistered();

        vehicleOwners[_vin] = msg.sender;
        vehiclePassportHashes[_vin] = _passportHash;

        emit VehicleRegistered(_vin, msg.sender);
    }

    /**
     * @notice Creates a new repair request for a registered vehicle.
     * @param _vin The Vehicle Identification Number.
     * @param _requestPdfHash The hash of the request PDF document.
     * @return The newly created job ID.
     */
    function createRequest(string calldata _vin, string calldata _requestPdfHash) external returns (uint256) {
        if (vehicleOwners[_vin] != msg.sender) revert NotVehicleOwner();

        // Gas optimization: incrementing counter inside unchecked block since overflow is impossible
        unchecked { ++jobCounter; }

        RepairJob storage newJob = repairJobs[jobCounter];
        newJob.id = jobCounter;
        newJob.vin = _vin;
        newJob.client = msg.sender;
        newJob.status = Status.RequestCreated;
        newJob.requestPdfHash = _requestPdfHash;

        emit StatusChanged(jobCounter, Status.RequestCreated, "");

        return jobCounter;
    }

    /**
     * @notice Admin approves a newly created repair request.
     * @param _jobId The ID of the repair job.
     */
    function adminApprove(uint256 _jobId) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.RequestCreated) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.RequestCreated);
        }

        repairJobs[_jobId].status = Status.AcceptedByAdmin;
        emit StatusChanged(_jobId, Status.AcceptedByAdmin, "");
    }

    /**
     * @notice Admin marks the vehicle as arrived at the station.
     * @param _jobId The ID of the repair job.
     */
    function markArrival(uint256 _jobId) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.AcceptedByAdmin) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.AcceptedByAdmin);
        }

        repairJobs[_jobId].status = Status.VehicleArrived;
        emit StatusChanged(_jobId, Status.VehicleArrived, "");
    }

    /**
     * @notice Admin sets the inspection results and required deposit.
     * @param _jobId The ID of the repair job.
     * @param _total The estimated total cost of the repair.
     * @param _deposit The required deposit amount.
     * @param _inspectionHash The hash of the inspection report document.
     */
    function setInspectionResult(
        uint256 _jobId,
        uint256 _total,
        uint256 _deposit,
        string calldata _inspectionHash
    ) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.VehicleArrived) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.VehicleArrived);
        }

        RepairJob storage job = repairJobs[_jobId];
        job.estimatedTotal = _total;
        job.depositRequired = _deposit;
        job.inspectionPdfHash = _inspectionHash;
        job.status = Status.Inspected;

        emit StatusChanged(_jobId, Status.Inspected, "");
    }

    /**
     * @notice Client confirms the deposit has been paid (Legacy/Basic flow).
     * @param _jobId The ID of the repair job.
     */
    function confirmDeposit(uint256 _jobId) external onlyClient(_jobId) {
        if (repairJobs[_jobId].status != Status.Inspected) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.Inspected);
        }

        repairJobs[_jobId].status = Status.DepositPaid;
        emit StatusChanged(_jobId, Status.DepositPaid, "");
    }

    /**
     * @notice Admin confirms a manual deposit payment.
     * @param _jobId The ID of the repair job.
     * @param _receiptHash The hash of the payment receipt.
     */
    function confirmDepositPaid(uint256 _jobId, string calldata _receiptHash) external onlyAdmin {
        RepairJob storage job = repairJobs[_jobId];
        if (job.status != Status.Inspected) revert InvalidJobStatus(job.status, Status.Inspected);

        job.status = Status.DepositPaid;
        job.receiptPdfHash = _receiptHash;

        emit StatusChanged(_jobId, Status.DepositPaid, "Manual payment confirmed by admin");
    }

    /**
     * @notice Admin (via backend webhook) confirms an online deposit payment.
     * @param _jobId The ID of the repair job.
     * @param _receiptHash The hash of the online payment receipt.
     */
    function payDepositOnline(uint256 _jobId, string calldata _receiptHash) external onlyAdmin {
        RepairJob storage job = repairJobs[_jobId];
        if (job.status != Status.Inspected) revert InvalidJobStatus(job.status, Status.Inspected);

        job.status = Status.DepositPaid;
        job.receiptPdfHash = _receiptHash;

        emit StatusChanged(_jobId, Status.DepositPaid, "Online payment confirmed");
    }

    /**
     * @notice Admin starts the repair process.
     * @param _jobId The ID of the repair job.
     */
    function startRepair(uint256 _jobId) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.DepositPaid) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.DepositPaid);
        }

        repairJobs[_jobId].status = Status.WorkInProgress;
        emit StatusChanged(_jobId, Status.WorkInProgress, "Mechanic started working on the vehicle");
    }

    /**
     * @notice Admin marks the repair as completed.
     * @param _jobId The ID of the repair job.
     * @param _workReportHash The hash of the final work report document.
     * @param _finalTotal The updated final total cost of the repair.
     */
    function completeRepair(uint256 _jobId, string calldata _workReportHash, uint256 _finalTotal) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.WorkInProgress) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.WorkInProgress);
        }

        RepairJob storage job = repairJobs[_jobId];
        job.status = Status.ReadyForPickup;
        job.workReportPdfHash = _workReportHash;
        job.estimatedTotal = _finalTotal;

        emit StatusChanged(_jobId, Status.ReadyForPickup, "Repair finished. Final price updated.");
    }

    /**
     * @notice Admin finalizes the job after the vehicle is picked up.
     * @param _jobId The ID of the repair job.
     * @param _receiptHash The hash of the final settlement receipt.
     */
    function finalizeJob(uint256 _jobId, string calldata _receiptHash) external onlyAdmin {
        if (repairJobs[_jobId].status != Status.ReadyForPickup) {
            revert InvalidJobStatus(repairJobs[_jobId].status, Status.ReadyForPickup);
        }

        repairJobs[_jobId].status = Status.Finalized;
        repairJobs[_jobId].receiptPdfHash = _receiptHash;

        emit StatusChanged(_jobId, Status.Finalized, "Vehicle picked up by owner");
    }



    /**
     * @notice Client cancels their repair request. Can only be done before work starts.
     * @param _jobId The ID of the repair job.
     * @param _reason The reason for cancellation.
     */
    function cancelRequest(uint256 _jobId, string calldata _reason) external onlyClient(_jobId) {
        // Only allow cancellation if status is before WorkInProgress (which is index 5)
        if (uint(repairJobs[_jobId].status) >= uint(Status.WorkInProgress)) revert InvalidCancelState();

        repairJobs[_jobId].status = Status.Cancelled;
        repairJobs[_jobId].cancelReason = _reason;

        emit StatusChanged(_jobId, Status.Cancelled, _reason);
    }

    /**
     * @notice Retrieves the full details of a repair job.
     * @param _jobId The ID of the repair job.
     * @return The RepairJob struct containing all job details.
     */
    function getJob(uint256 _jobId) external view returns (RepairJob memory) {
        return repairJobs[_jobId];
    }
}