// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AI Chain Guard
 * @dev Immutable ledger for AI Models, Datasets, and Security Events.
 */
contract AIChainGuard {
    
    struct AIModel {
        uint256 id;
        string modelHash;
        address owner;
        uint256 timestamp;
    }

    struct Dataset {
        uint256 id;
        string datasetHash;
        address owner;
        uint256 timestamp;
    }

    struct SecurityEvent {
        uint256 id;
        string eventHash;
        address reporter;
        uint256 timestamp;
    }

    struct FraudDecision {
        uint256 id;
        string txHash;
        uint256 fraudScore;
        string modelVersion;
        string reasonHash;
        address reporter;
        uint256 timestamp;
    }

    struct ModelWeightUpdate {
        uint256 id;
        string roundId;
        string newWeightHash;
        uint256 nodesParticipated;
        address aggregator;
        uint256 timestamp;
    }

    struct SelfHealingAction {
        uint256 id;
        string nodeIdentifier;
        string actionType; // ISOLATE, RESTORE, REDIRECT
        string reason;
        address executingAgent;
        uint256 timestamp;
    }

    // State Variables
    uint256 public modelCount = 0;
    uint256 public datasetCount = 0;
    uint256 public securityEventCount = 0;
    uint256 public fraudDecisionCount = 0;
    uint256 public modelWeightUpdateCount = 0;
    uint256 public selfHealingActionCount = 0;

    // Mappings
    mapping(uint256 => AIModel) public models;
    mapping(uint256 => Dataset) public datasets;
    mapping(uint256 => SecurityEvent) public securityEvents;
    mapping(uint256 => FraudDecision) public fraudDecisions;
    mapping(uint256 => ModelWeightUpdate) public weightUpdates;
    mapping(uint256 => SelfHealingAction) public healingActions;

    // Events
    event ModelRegistered(uint256 indexed id, string modelHash, address indexed owner, uint256 timestamp);
    event DatasetRegistered(uint256 indexed id, string datasetHash, address indexed owner, uint256 timestamp);
    event SecurityEventRecorded(uint256 indexed id, string eventHash, address indexed reporter, uint256 timestamp);
    event FraudDecisionLogged(uint256 indexed id, string txHash, uint256 fraudScore, string modelVersion, string reasonHash, address indexed reporter, uint256 timestamp);
    event ModelWeightUpdated(uint256 indexed id, string roundId, string newWeightHash, uint256 nodesParticipated, address indexed aggregator, uint256 timestamp);
    event SelfHealingActionLogged(uint256 indexed id, string nodeIdentifier, string actionType, string reason, address indexed executingAgent, uint256 timestamp);

    /**
     * @dev Register a new AI Model onto the blockchain
     * @param _modelHash SHA256 hash of the AI model file/architecture
     */
    function registerModel(string memory _modelHash) public {
        require(bytes(_modelHash).length > 0, "Model hash cannot be empty");
        
        modelCount++;
        models[modelCount] = AIModel(modelCount, _modelHash, msg.sender, block.timestamp);
        
        emit ModelRegistered(modelCount, _modelHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Register a new training dataset onto the blockchain
     * @param _datasetHash SHA256 hash of the dataset
     */
    function registerDataset(string memory _datasetHash) public {
        require(bytes(_datasetHash).length > 0, "Dataset hash cannot be empty");
        
        datasetCount++;
        datasets[datasetCount] = Dataset(datasetCount, _datasetHash, msg.sender, block.timestamp);
        
        emit DatasetRegistered(datasetCount, _datasetHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Record a security event (like anomaly detection / block)
     * @param _eventHash Cryptographic hash representing the event details
     */
    function registerSecurityEvent(string memory _eventHash) public {
        require(bytes(_eventHash).length > 0, "Event hash cannot be empty");
        
        securityEventCount++;
        securityEvents[securityEventCount] = SecurityEvent(securityEventCount, _eventHash, msg.sender, block.timestamp);
        
        emit SecurityEventRecorded(securityEventCount, _eventHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Record an AI fraud decision to the blockchain for XAI audit trail
     * @param _txHash Identifier of the bank transaction
     * @param _fraudScore AI evaluated risk score (0-100)
     * @param _modelVersion AI model used
     * @param _reasonHash Hash of the XAI explanation (SHAP/LIME factors)
     */
    function logFraudDecision(string memory _txHash, uint256 _fraudScore, string memory _modelVersion, string memory _reasonHash) public {
        require(bytes(_txHash).length > 0, "Transaction hash cannot be empty");
        
        fraudDecisionCount++;
        fraudDecisions[fraudDecisionCount] = FraudDecision(fraudDecisionCount, _txHash, _fraudScore, _modelVersion, _reasonHash, msg.sender, block.timestamp);
        
        emit FraudDecisionLogged(fraudDecisionCount, _txHash, _fraudScore, _modelVersion, _reasonHash, msg.sender, block.timestamp);
    }

    /**
     * @dev Record a federated learning global update
     * @param _roundId Round identifier
     * @param _newWeightHash Hash of the aggregated global weights
     * @param _nodesParticipated Number of nodes involved in this round
     */
    function logModelWeightUpdate(string memory _roundId, string memory _newWeightHash, uint256 _nodesParticipated) public {
        require(bytes(_roundId).length > 0, "Round ID cannot be empty");
        
        modelWeightUpdateCount++;
        weightUpdates[modelWeightUpdateCount] = ModelWeightUpdate(modelWeightUpdateCount, _roundId, _newWeightHash, _nodesParticipated, msg.sender, block.timestamp);
        
        emit ModelWeightUpdated(modelWeightUpdateCount, _roundId, _newWeightHash, _nodesParticipated, msg.sender, block.timestamp);
    }

    /**
     * @dev Record a self-healing action (Isolation/Restoration)
     * @param _nodeIdentifier The service/node affected
     * @param _actionType ISOLATE, RESTORE, etc.
     * @param _reason The trigger for this action
     */
    function logSelfHealingAction(string memory _nodeIdentifier, string memory _actionType, string memory _reason) public {
        require(bytes(_nodeIdentifier).length > 0, "Node identifier cannot be empty");
        
        selfHealingActionCount++;
        healingActions[selfHealingActionCount] = SelfHealingAction(selfHealingActionCount, _nodeIdentifier, _actionType, _reason, msg.sender, block.timestamp);
        
        emit SelfHealingActionLogged(selfHealingActionCount, _nodeIdentifier, _actionType, _reason, msg.sender, block.timestamp);
    }

    // View Functions for explicit retrieval (though mappings create automatic getters)
    
    function getModel(uint256 _id) public view returns (uint256, string memory, address, uint256) {
        require(_id > 0 && _id <= modelCount, "Model does not exist");
        AIModel memory m = models[_id];
        return (m.id, m.modelHash, m.owner, m.timestamp);
    }

    function getDataset(uint256 _id) public view returns (uint256, string memory, address, uint256) {
        require(_id > 0 && _id <= datasetCount, "Dataset does not exist");
        Dataset memory d = datasets[_id];
        return (d.id, d.datasetHash, d.owner, d.timestamp);
    }

    function getSecurityEvent(uint256 _id) public view returns (uint256, string memory, address, uint256) {
        require(_id > 0 && _id <= securityEventCount, "Security Event does not exist");
        SecurityEvent memory s = securityEvents[_id];
        return (s.id, s.eventHash, s.reporter, s.timestamp);
    }

    function getFraudDecision(uint256 _id) public view returns (uint256, string memory, uint256, string memory, string memory, address, uint256) {
        require(_id > 0 && _id <= fraudDecisionCount, "Fraud Decision does not exist");
        FraudDecision memory f = fraudDecisions[_id];
        return (f.id, f.txHash, f.fraudScore, f.modelVersion, f.reasonHash, f.reporter, f.timestamp);
    }

    function getWeightUpdate(uint256 _id) public view returns (uint256, string memory, string memory, uint256, address, uint256) {
        require(_id > 0 && _id <= modelWeightUpdateCount, "Weight Update does not exist");
        ModelWeightUpdate memory w = weightUpdates[_id];
        return (w.id, w.roundId, w.newWeightHash, w.nodesParticipated, w.aggregator, w.timestamp);
    }

    function getSelfHealingAction(uint256 _id) public view returns (uint256, string memory, string memory, string memory, address, uint256) {
        require(_id > 0 && _id <= selfHealingActionCount, "Self Healing Action does not exist");
        SelfHealingAction memory h = healingActions[_id];
        return (h.id, h.nodeIdentifier, h.actionType, h.reason, h.executingAgent, h.timestamp);
    }
}
