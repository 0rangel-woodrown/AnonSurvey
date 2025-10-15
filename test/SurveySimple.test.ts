import { expect } from "chai";
import { ethers } from "hardhat";
import { SurveySimple } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("SurveySimple", function () {
  let survey: SurveySimple;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const SurveyFactory = await ethers.getContractFactory("SurveySimple");
    survey = await SurveyFactory.deploy();
    await survey.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await survey.owner()).to.equal(owner.address);
    });

    it("Should start with zero surveys", async function () {
      expect(await survey.surveyCount()).to.equal(0);
    });
  });

  describe("Survey Creation", function () {
    it("Should create a new survey", async function () {
      const title = "Product Satisfaction Survey";
      const duration = 7 * 24 * 3600; // 7 days

      const tx = await survey.createSurvey(title, duration);
      await tx.wait();

      const surveyInfo = await survey.getSurveyInfo(0);
      expect(surveyInfo.title).to.equal(title);
      expect(surveyInfo.participantCount).to.equal(0);
      expect(surveyInfo.status).to.equal(0); // Active
    });

    it("Should emit SurveyCreated event", async function () {
      const title = "Test Survey";
      const duration = 3600;

      await expect(survey.createSurvey(title, duration))
        .to.emit(survey, "SurveyCreated")
        .withArgs(0, title);
    });

    it("Should increment survey count", async function () {
      await survey.createSurvey("Survey 1", 3600);
      expect(await survey.surveyCount()).to.equal(1);

      await survey.createSurvey("Survey 2", 3600);
      expect(await survey.surveyCount()).to.equal(2);
    });
  });

  describe("Survey Management", function () {
    beforeEach(async function () {
      await survey.createSurvey("Test Survey", 7 * 24 * 3600);
    });

    it("Should allow owner to close survey", async function () {
      await survey.closeSurvey(0);

      const surveyInfo = await survey.getSurveyInfo(0);
      expect(surveyInfo.status).to.equal(1); // Closed
    });

    it("Should not allow non-owner to close survey", async function () {
      await expect(
        survey.connect(user1).closeSurvey(0)
      ).to.be.revertedWithCustomError(survey, "NotOwner");
    });

    it("Should emit SurveyClosed event", async function () {
      await expect(survey.closeSurvey(0))
        .to.emit(survey, "SurveyClosed")
        .withArgs(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await survey.createSurvey("Test Survey", 3600);
    });

    it("Should return correct survey info", async function () {
      const info = await survey.getSurveyInfo(0);

      expect(info.title).to.equal("Test Survey");
      expect(info.participantCount).to.equal(0);
      expect(info.status).to.equal(0); // Active
    });

    it("Should check submission status", async function () {
      const submitted = await survey.userSubmitted(0, user1.address);
      expect(submitted).to.be.false;
    });
  });
});
