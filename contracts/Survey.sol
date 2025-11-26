// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Survey
 * @notice Advanced anonymous survey system with multi-question types, response validation, and statistical analysis
 * @dev Updated for fhEVM v0.9.1 - Using FHE library with self-relaying decryption model
 */
contract Survey is ZamaEthereumConfig {
    address public owner;
    address public surveyManager;
    address public dataAnalyst;

    enum SurveyStatus {
        Draft,
        Active,
        Paused,
        Closed,
        Finalized,
        Decrypted
    }

    enum QuestionType {
        Rating,
        YesNo,
        MultiChoice,
        Numeric,
        Sentiment
    }

    struct Question {
        bytes32 questionId;
        QuestionType qType;
        uint8 maxValue;
        uint8 minValue;
        string questionText;
    }

    struct SurveyMetadata {
        uint256 surveyId;
        address creator;
        string title;
        string description;
        uint8 numQuestions;
        uint256 deadline;
        uint256 createdAt;
        uint256 closedAt;
        uint256 finalizedAt;
        SurveyStatus status;
        uint32 participantCount;
        uint32 targetParticipants;
        uint8 minAge;
        bool requiresVerification;
        uint256 statusChangeCount;
    }

    struct ResponseRecord {
        uint256 surveyId;
        address respondent;
        uint256 submittedAt;
        uint8 questionsAnswered;
        euint16 responseQualityScoreCipher;
        euint8 completionTimeCipher;
        bool verified;
    }

    struct QuestionStatistics {
        bytes32 questionId;
        euint32 totalScoreCipher;
        euint32 sumOfSquaresCipher;
        euint16 minResponseCipher;
        euint16 maxResponseCipher;
        euint32 varianceCipher;
        uint32 responseCount;
        uint32 decryptedAverage;
        uint32 decryptedVariance;
        bool decrypted;
        bool initialized; // FHE values initialized on first response
    }

    struct ParticipantProfile {
        address participant;
        uint256 totalSurveysCompleted;
        uint256 totalQuestionsAnswered;
        euint32 averageQualityScoreCipher;
        euint16 reliabilityScoreCipher;
        uint256 firstSurveyAt;
        uint256 lastSurveyAt;
    }

    // Decryption request tracking for self-relaying model
    struct DecryptionRequest {
        uint256 surveyId;
        bytes32 questionId;
        euint32 totalScoreHandle;
        euint32 varianceHandle;
        bool pending;
        uint256 requestedAt;
    }

    mapping(uint256 => SurveyMetadata) private surveys;
    mapping(uint256 => Question[]) private surveyQuestions;
    mapping(uint256 => mapping(bytes32 => QuestionStatistics)) private questionStats;
    mapping(uint256 => mapping(address => ResponseRecord)) private responses;
    mapping(uint256 => mapping(address => bool)) private hasSubmitted;
    mapping(uint256 => address[]) private surveyParticipants;
    mapping(address => ParticipantProfile) private participantProfiles;
    mapping(address => uint256[]) private participantSurveys;

    // Global aggregates
    uint256 private totalSurveys;
    uint256 private totalResponses;
    uint256 private totalQuestions;
    euint32 private aggregatedQualityScores;
    bool private aggregatedInitialized; // Lazy init for FHE
    mapping(uint256 => bool) private decryptionReady;
    mapping(uint256 => uint256) private decryptionExpiry;

    // Self-relaying decryption tracking (v0.9.1)
    uint256 private nextDecryptionRequestId;
    mapping(uint256 => DecryptionRequest) private decryptionRequests;
    mapping(uint256 => mapping(bytes32 => uint256)) private questionDecryptionRequestId;

    event SurveyCreated(uint256 indexed surveyId, address indexed creator, string title, uint8 numQuestions);
    event SurveyStatusChanged(uint256 indexed surveyId, SurveyStatus oldStatus, SurveyStatus newStatus);
    event QuestionAdded(uint256 indexed surveyId, bytes32 indexed questionId, QuestionType qType);
    event ResponseSubmitted(uint256 indexed surveyId, address indexed respondent, uint8 questionsAnswered);
    event SurveyFinalized(uint256 indexed surveyId, uint32 participantCount);
    event DecryptionRequested(uint256 indexed surveyId, bytes32 indexed questionId, uint256 requestId);
    event DecryptionReady(uint256 indexed surveyId, bytes32 indexed questionId, uint256 requestId);
    event ResultsDecrypted(uint256 indexed surveyId, bytes32 indexed questionId, uint32 average, uint32 variance);
    event SurveyPaused(uint256 indexed surveyId);
    event SurveyResumed(uint256 indexed surveyId);
    event SurveyClosed(uint256 indexed surveyId);
    event SurveyManagerUpdated(address indexed newManager);
    event DataAnalystUpdated(address indexed newAnalyst);

    error SurveyNotFound();
    error SurveyAlreadyExists();
    error InvalidStatus();
    error InvalidAddress();
    error NotOwner();
    error NotSurveyManager();
    error NotDataAnalyst();
    error NotAuthorized();
    error DeadlinePassed();
    error AlreadySubmitted();
    error InvalidQuestionCount();
    error InvalidDuration();
    error DecryptionNotReady();
    error NoParticipants();
    error InvalidSignature();
    error DecryptionPending();

    constructor() {
        owner = msg.sender;
        surveyManager = msg.sender;
        dataAnalyst = msg.sender;
        // FHE values initialized lazily on first submitResponse
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySurveyManager() {
        if (msg.sender != surveyManager) revert NotSurveyManager();
        _;
    }

    modifier onlyDataAnalyst() {
        if (msg.sender != dataAnalyst) revert NotDataAnalyst();
        _;
    }

    function createSurvey(
        uint256 surveyId,
        string memory title,
        string memory description,
        uint8 numQuestions,
        uint256 duration,
        uint32 targetParticipants,
        uint8 minAge,
        bool requiresVerification
    ) external {
        if (surveys[surveyId].creator != address(0)) revert SurveyAlreadyExists();
        if (numQuestions == 0 || numQuestions > 50) revert InvalidQuestionCount();
        if (duration < 1 hours || duration > 90 days) revert InvalidDuration();

        SurveyMetadata storage survey = surveys[surveyId];
        survey.surveyId = surveyId;
        survey.creator = msg.sender;
        survey.title = title;
        survey.description = description;
        survey.numQuestions = numQuestions;
        survey.deadline = block.timestamp + duration;
        survey.createdAt = block.timestamp;
        survey.status = SurveyStatus.Draft;
        survey.participantCount = 0;
        survey.targetParticipants = targetParticipants;
        survey.minAge = minAge;
        survey.requiresVerification = requiresVerification;
        survey.statusChangeCount = 1;

        totalSurveys += 1;
        decryptionReady[surveyId] = false;

        emit SurveyCreated(surveyId, msg.sender, title, numQuestions);
        emit SurveyStatusChanged(surveyId, SurveyStatus.Draft, SurveyStatus.Draft);
    }

    function addQuestion(
        uint256 surveyId,
        bytes32 questionId,
        QuestionType qType,
        uint8 minValue,
        uint8 maxValue,
        string memory questionText
    ) external {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.creator != msg.sender && msg.sender != surveyManager) revert NotAuthorized();
        if (survey.status != SurveyStatus.Draft) revert InvalidStatus();

        Question memory question = Question({
            questionId: questionId,
            qType: qType,
            maxValue: maxValue,
            minValue: minValue,
            questionText: questionText
        });

        surveyQuestions[surveyId].push(question);

        // Only set plaintext fields - FHE values initialized on first response
        QuestionStatistics storage stats = questionStats[surveyId][questionId];
        stats.questionId = questionId;
        stats.responseCount = 0;
        stats.decrypted = false;
        stats.initialized = false;

        totalQuestions += 1;

        emit QuestionAdded(surveyId, questionId, qType);
    }

    function activateSurvey(uint256 surveyId) external onlySurveyManager {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Draft) revert InvalidStatus();
        if (surveyQuestions[surveyId].length != survey.numQuestions) revert InvalidQuestionCount();

        survey.status = SurveyStatus.Active;
        survey.statusChangeCount += 1;

        emit SurveyStatusChanged(surveyId, SurveyStatus.Draft, SurveyStatus.Active);
    }

    function submitResponse(
        uint256 surveyId,
        bytes32[] memory questionIds,
        externalEuint16[] memory encryptedAnswers,
        bytes memory inputProof,
        externalEuint16 qualityScoreInput,
        externalEuint8 completionTimeInput
    ) external {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Active) revert InvalidStatus();
        if (block.timestamp >= survey.deadline) revert DeadlinePassed();
        if (hasSubmitted[surveyId][msg.sender]) revert AlreadySubmitted();
        if (questionIds.length != encryptedAnswers.length) revert InvalidQuestionCount();

        // Convert external encrypted inputs to internal euint types using inputProof
        euint16 qualityScore = FHE.fromExternal(qualityScoreInput, inputProof);
        euint8 completionTime = FHE.fromExternal(completionTimeInput, inputProof);

        // Process each answer
        for (uint256 i = 0; i < questionIds.length; i++) {
            euint16 answer = FHE.fromExternal(encryptedAnswers[i], inputProof);

            QuestionStatistics storage stats = questionStats[surveyId][questionIds[i]];

            // Initialize FHE values on first response
            if (!stats.initialized) {
                stats.totalScoreCipher = FHE.asEuint32(answer);
                stats.sumOfSquaresCipher = FHE.mul(FHE.asEuint32(answer), FHE.asEuint32(answer));
                stats.minResponseCipher = answer;
                stats.maxResponseCipher = answer;
                stats.varianceCipher = FHE.asEuint32(0);
                stats.initialized = true;
            } else {
                // Update total score
                stats.totalScoreCipher = FHE.add(stats.totalScoreCipher, FHE.asEuint32(answer));

                // Update sum of squares for variance calculation
                euint32 answerSquared = FHE.mul(FHE.asEuint32(answer), FHE.asEuint32(answer));
                stats.sumOfSquaresCipher = FHE.add(stats.sumOfSquaresCipher, answerSquared);

                // Update min/max
                ebool isNewMin = FHE.lt(answer, stats.minResponseCipher);
                stats.minResponseCipher = FHE.select(isNewMin, answer, stats.minResponseCipher);

                ebool isNewMax = FHE.gt(answer, stats.maxResponseCipher);
                stats.maxResponseCipher = FHE.select(isNewMax, answer, stats.maxResponseCipher);
            }

            stats.responseCount += 1;

            FHE.allowThis(stats.totalScoreCipher);
            FHE.allowThis(stats.sumOfSquaresCipher);
            FHE.allowThis(stats.minResponseCipher);
            FHE.allowThis(stats.maxResponseCipher);
        }

        ResponseRecord memory record = ResponseRecord({
            surveyId: surveyId,
            respondent: msg.sender,
            submittedAt: block.timestamp,
            questionsAnswered: uint8(questionIds.length),
            responseQualityScoreCipher: qualityScore,
            completionTimeCipher: completionTime,
            verified: !survey.requiresVerification
        });

        responses[surveyId][msg.sender] = record;
        hasSubmitted[surveyId][msg.sender] = true;
        surveyParticipants[surveyId].push(msg.sender);
        survey.participantCount += 1;

        FHE.allowThis(qualityScore);
        FHE.allowThis(completionTime);

        ParticipantProfile storage profile = participantProfiles[msg.sender];
        if (profile.participant == address(0)) {
            profile.participant = msg.sender;
            profile.firstSurveyAt = block.timestamp;
            profile.averageQualityScoreCipher = FHE.asEuint32(0);
            profile.reliabilityScoreCipher = FHE.asEuint16(500);
            FHE.allowThis(profile.averageQualityScoreCipher);
            FHE.allowThis(profile.reliabilityScoreCipher);
        }
        profile.totalSurveysCompleted += 1;
        profile.totalQuestionsAnswered += questionIds.length;
        profile.lastSurveyAt = block.timestamp;

        // Update average quality score (simplified: new average = (old + new) / 2)
        profile.averageQualityScoreCipher = FHE.div(
            FHE.add(profile.averageQualityScoreCipher, FHE.asEuint32(qualityScore)),
            2
        );
        profile.reliabilityScoreCipher = FHE.add(profile.reliabilityScoreCipher, FHE.asEuint16(10));

        participantSurveys[msg.sender].push(surveyId);

        // Lazy init aggregatedQualityScores
        if (!aggregatedInitialized) {
            aggregatedQualityScores = FHE.asEuint32(qualityScore);
            aggregatedInitialized = true;
        } else {
            aggregatedQualityScores = FHE.add(aggregatedQualityScores, FHE.asEuint32(qualityScore));
        }
        FHE.allowThis(aggregatedQualityScores);
        totalResponses += 1;

        emit ResponseSubmitted(surveyId, msg.sender, uint8(questionIds.length));
    }

    function pauseSurvey(uint256 surveyId) external onlySurveyManager {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Active) revert InvalidStatus();

        survey.status = SurveyStatus.Paused;
        survey.statusChangeCount += 1;

        emit SurveyPaused(surveyId);
        emit SurveyStatusChanged(surveyId, SurveyStatus.Active, SurveyStatus.Paused);
    }

    function resumeSurvey(uint256 surveyId) external onlySurveyManager {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Paused) revert InvalidStatus();

        survey.status = SurveyStatus.Active;
        survey.statusChangeCount += 1;

        emit SurveyResumed(surveyId);
        emit SurveyStatusChanged(surveyId, SurveyStatus.Paused, SurveyStatus.Active);
    }

    function closeSurvey(uint256 surveyId) external {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (msg.sender != survey.creator && msg.sender != surveyManager) revert NotAuthorized();
        if (survey.status != SurveyStatus.Active && survey.status != SurveyStatus.Paused) revert InvalidStatus();

        survey.status = SurveyStatus.Closed;
        survey.closedAt = block.timestamp;
        survey.statusChangeCount += 1;

        emit SurveyClosed(surveyId);
        emit SurveyStatusChanged(surveyId, survey.status, SurveyStatus.Closed);
    }

    function finalizeSurvey(uint256 surveyId) external onlyDataAnalyst {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Closed) revert InvalidStatus();
        if (survey.participantCount == 0) revert NoParticipants();

        survey.status = SurveyStatus.Finalized;
        survey.finalizedAt = block.timestamp;
        survey.statusChangeCount += 1;
        decryptionReady[surveyId] = true;
        decryptionExpiry[surveyId] = block.timestamp + 30 days;

        emit SurveyFinalized(surveyId, survey.participantCount);
        emit SurveyStatusChanged(surveyId, SurveyStatus.Closed, SurveyStatus.Finalized);
    }

    /**
     * @notice Request decryption for a question (v0.9.1 self-relaying model)
     * @dev Makes the encrypted values publicly decryptable for off-chain processing
     * @param surveyId Survey ID
     * @param questionId Question ID
     * @return requestId The decryption request ID for tracking
     */
    function requestQuestionDecryption(uint256 surveyId, bytes32 questionId) external returns (uint256) {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.status != SurveyStatus.Finalized) revert InvalidStatus();
        if (!decryptionReady[surveyId]) revert DecryptionNotReady();

        QuestionStatistics storage stats = questionStats[surveyId][questionId];
        if (stats.decrypted) revert InvalidStatus();

        // Check if decryption already pending
        uint256 existingRequestId = questionDecryptionRequestId[surveyId][questionId];
        if (existingRequestId != 0 && decryptionRequests[existingRequestId].pending) {
            revert DecryptionPending();
        }

        // Calculate variance: Var = (sumOfSquares / n) - (average)^2
        // Note: div in v0.9.1 takes plaintext divisor
        euint32 avgSquared = FHE.div(stats.totalScoreCipher, stats.responseCount);
        avgSquared = FHE.mul(avgSquared, avgSquared);
        euint32 meanOfSquares = FHE.div(stats.sumOfSquaresCipher, stats.responseCount);
        stats.varianceCipher = FHE.sub(meanOfSquares, avgSquared);

        FHE.allowThis(stats.varianceCipher);

        // v0.9.1: Make values publicly decryptable for self-relaying
        FHE.makePubliclyDecryptable(stats.totalScoreCipher);
        FHE.makePubliclyDecryptable(stats.varianceCipher);

        // Create decryption request record
        uint256 requestId = ++nextDecryptionRequestId;
        decryptionRequests[requestId] = DecryptionRequest({
            surveyId: surveyId,
            questionId: questionId,
            totalScoreHandle: stats.totalScoreCipher,
            varianceHandle: stats.varianceCipher,
            pending: true,
            requestedAt: block.timestamp
        });

        questionDecryptionRequestId[surveyId][questionId] = requestId;

        emit DecryptionRequested(surveyId, questionId, requestId);
        emit DecryptionReady(surveyId, questionId, requestId);

        return requestId;
    }

    /**
     * @notice Get decryption request details for off-chain processing
     * @param requestId The decryption request ID
     * @return surveyId Survey ID
     * @return questionId Question ID
     * @return totalScoreHandle Handle for total score (use with publicDecrypt)
     * @return varianceHandle Handle for variance (use with publicDecrypt)
     * @return pending Whether the request is still pending
     */
    function getDecryptionRequest(uint256 requestId) external view returns (
        uint256 surveyId,
        bytes32 questionId,
        euint32 totalScoreHandle,
        euint32 varianceHandle,
        bool pending
    ) {
        DecryptionRequest storage req = decryptionRequests[requestId];
        return (
            req.surveyId,
            req.questionId,
            req.totalScoreHandle,
            req.varianceHandle,
            req.pending
        );
    }

    /**
     * @notice Submit decrypted results with signature verification (v0.9.1)
     * @dev Called by off-chain relayer after publicDecrypt
     * @param requestId The decryption request ID
     * @param totalScore Decrypted total score
     * @param variance Decrypted variance
     * @param decryptionProof KMS decryption proof for verification
     */
    function submitDecryptedResults(
        uint256 requestId,
        uint32 totalScore,
        uint32 variance,
        bytes calldata decryptionProof
    ) external {
        DecryptionRequest storage req = decryptionRequests[requestId];
        if (!req.pending) revert InvalidStatus();

        // v0.9.1: Verify KMS signatures using IKMSVerifier
        bytes32[] memory handlesList = new bytes32[](2);
        handlesList[0] = bytes32(euint32.unwrap(req.totalScoreHandle));
        handlesList[1] = bytes32(euint32.unwrap(req.varianceHandle));

        bytes memory decryptedResult = abi.encode(totalScore, variance);

        // Verify signatures from KMS
        bool isValid = IKMSVerifier(ZamaConfig.getEthereumCoprocessorConfig().KMSVerifierAddress)
            .verifyDecryptionEIP712KMSSignatures(handlesList, decryptedResult, decryptionProof);
        if (!isValid) revert InvalidSignature();

        // Process the decrypted results
        uint256 surveyId = req.surveyId;
        bytes32 questionId = req.questionId;

        SurveyMetadata storage survey = surveys[surveyId];
        QuestionStatistics storage stats = questionStats[surveyId][questionId];

        uint32 average = totalScore / stats.responseCount;
        stats.decryptedAverage = average;
        stats.decryptedVariance = variance;
        stats.decrypted = true;

        req.pending = false;

        // Check if all questions are decrypted
        bool allDecrypted = true;
        Question[] storage questions = surveyQuestions[surveyId];
        for (uint256 i = 0; i < questions.length; i++) {
            if (!questionStats[surveyId][questions[i].questionId].decrypted) {
                allDecrypted = false;
                break;
            }
        }

        if (allDecrypted) {
            survey.status = SurveyStatus.Decrypted;
            survey.statusChangeCount += 1;
            emit SurveyStatusChanged(surveyId, SurveyStatus.Finalized, SurveyStatus.Decrypted);
        }

        emit ResultsDecrypted(surveyId, questionId, average, variance);
    }

    function getSurveyInfo(uint256 surveyId)
        external
        view
        returns (
            address creator,
            string memory title,
            uint8 numQuestions,
            uint256 deadline,
            SurveyStatus status,
            uint32 participantCount,
            uint32 targetParticipants,
            uint256 statusChangeCount
        )
    {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();

        return (
            survey.creator,
            survey.title,
            survey.numQuestions,
            survey.deadline,
            survey.status,
            survey.participantCount,
            survey.targetParticipants,
            survey.statusChangeCount
        );
    }

    function getQuestionResults(uint256 surveyId, bytes32 questionId)
        external
        view
        returns (uint32 average, uint32 variance, uint32 responseCount, bool decrypted)
    {
        QuestionStatistics storage stats = questionStats[surveyId][questionId];
        return (stats.decryptedAverage, stats.decryptedVariance, stats.responseCount, stats.decrypted);
    }

    function getMySurveyResults(uint256 surveyId)
        external
        view
        returns (
            string memory title,
            uint32 participantCount,
            uint32 targetParticipants,
            SurveyStatus status,
            Question[] memory questions,
            QuestionStatistics[] memory statistics
        )
    {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        if (survey.creator != msg.sender) revert NotAuthorized();

        questions = surveyQuestions[surveyId];
        statistics = new QuestionStatistics[](questions.length);

        for (uint256 i = 0; i < questions.length; i++) {
            statistics[i] = questionStats[surveyId][questions[i].questionId];
        }

        return (
            survey.title,
            survey.participantCount,
            survey.targetParticipants,
            survey.status,
            questions,
            statistics
        );
    }

    function getSurveyQuestions(uint256 surveyId)
        external
        view
        returns (Question[] memory)
    {
        SurveyMetadata storage survey = surveys[surveyId];
        if (survey.creator == address(0)) revert SurveyNotFound();
        return surveyQuestions[surveyId];
    }

    function getParticipantProfile(address participant)
        external
        view
        returns (
            uint256 totalSurveysCompleted,
            uint256 totalQuestionsAnswered,
            uint256 firstSurveyAt,
            uint256 lastSurveyAt
        )
    {
        ParticipantProfile storage profile = participantProfiles[participant];
        return (
            profile.totalSurveysCompleted,
            profile.totalQuestionsAnswered,
            profile.firstSurveyAt,
            profile.lastSurveyAt
        );
    }

    function hasUserSubmitted(uint256 surveyId, address user) external view returns (bool) {
        return hasSubmitted[surveyId][user];
    }

    function getParticipantCount(uint256 surveyId) external view returns (uint256) {
        return surveyParticipants[surveyId].length;
    }

    function getQuestionCount(uint256 surveyId) external view returns (uint256) {
        return surveyQuestions[surveyId].length;
    }

    function getGlobalStatistics() external view returns (uint256, uint256, uint256) {
        return (totalSurveys, totalResponses, totalQuestions);
    }

    function updateSurveyManager(address newManager) external onlyOwner {
        if (newManager == address(0)) revert InvalidAddress();
        surveyManager = newManager;
        emit SurveyManagerUpdated(newManager);
    }

    function updateDataAnalyst(address newAnalyst) external onlyOwner {
        if (newAnalyst == address(0)) revert InvalidAddress();
        dataAnalyst = newAnalyst;
        emit DataAnalystUpdated(newAnalyst);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        owner = newOwner;
    }
}
