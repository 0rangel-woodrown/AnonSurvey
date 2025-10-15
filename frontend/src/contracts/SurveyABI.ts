export const SURVEY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadySubmitted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DeadlinePassed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DecryptionNotReady",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDuration",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidQuestionCount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoParticipants",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAuthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotDataAnalyst",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotSurveyManager",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SurveyAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SurveyNotFound",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newAnalyst",
        "type": "address"
      }
    ],
    "name": "DataAnalystUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      }
    ],
    "name": "DecryptionRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "enum Survey.QuestionType",
        "name": "qType",
        "type": "uint8"
      }
    ],
    "name": "QuestionAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "respondent",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "questionsAnswered",
        "type": "uint8"
      }
    ],
    "name": "ResponseSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "average",
        "type": "uint32"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "variance",
        "type": "uint32"
      }
    ],
    "name": "ResultsDecrypted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "SurveyClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "numQuestions",
        "type": "uint8"
      }
    ],
    "name": "SurveyCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "participantCount",
        "type": "uint32"
      }
    ],
    "name": "SurveyFinalized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "newManager",
        "type": "address"
      }
    ],
    "name": "SurveyManagerUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "SurveyPaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "SurveyResumed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum Survey.SurveyStatus",
        "name": "oldStatus",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "enum Survey.SurveyStatus",
        "name": "newStatus",
        "type": "uint8"
      }
    ],
    "name": "SurveyStatusChanged",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "activateSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      },
      {
        "internalType": "enum Survey.QuestionType",
        "name": "qType",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "minValue",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "maxValue",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "questionText",
        "type": "string"
      }
    ],
    "name": "addQuestion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "totalScore",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "variance",
        "type": "uint32"
      }
    ],
    "name": "callbackQuestionDecryption",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "closeSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "numQuestions",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "targetParticipants",
        "type": "uint32"
      },
      {
        "internalType": "uint8",
        "name": "minAge",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "requiresVerification",
        "type": "bool"
      }
    ],
    "name": "createSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dataAnalyst",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "finalizeSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getGlobalStatistics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      }
    ],
    "name": "getParticipantProfile",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalSurveysCompleted",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalQuestionsAnswered",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "firstSurveyAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastSurveyAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "getParticipantCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "getQuestionCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      }
    ],
    "name": "getQuestionResults",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "average",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "variance",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "responseCount",
        "type": "uint32"
      },
      {
        "internalType": "bool",
        "name": "decrypted",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "getSurveyInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "numQuestions",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "enum Survey.SurveyStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint32",
        "name": "participantCount",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "targetParticipants",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "statusChangeCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasUserSubmitted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "pauseSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "questionId",
        "type": "bytes32"
      }
    ],
    "name": "requestQuestionDecryption",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      }
    ],
    "name": "resumeSurvey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "surveyId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32[]",
        "name": "questionIds",
        "type": "bytes32[]"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct externalEuint16[]",
        "name": "encryptedAnswers",
        "type": "tuple[]"
      },
      {
        "internalType": "bytes[]",
        "name": "answerProofs",
        "type": "bytes[]"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct externalEuint16",
        "name": "qualityScoreExt",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "qualityScoreProof",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          }
        ],
        "internalType": "struct externalEuint8",
        "name": "completionTimeExt",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "completionTimeProof",
        "type": "bytes"
      }
    ],
    "name": "submitResponse",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "surveyManager",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAnalyst",
        "type": "address"
      }
    ],
    "name": "updateDataAnalyst",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newManager",
        "type": "address"
      }
    ],
    "name": "updateSurveyManager",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
