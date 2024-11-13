import React, { useState, useEffect, useRef } from "react";
import { sessionConfig } from "../config";
import styled from "styled-components";
import { useLocation, navigate } from "@reach/router";
import { notion } from "../services/notion";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f5f5f5;
`;

const Flashcard = styled.div`
  width: 80%;
  max-width: 400px;
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-align: center;

  h2 {
    font-size: 1.5em;
    color: #333;
  }

  img {
    width: 100%;
    height: auto;
    border-radius: 10px;
    margin-top: 15px;
  }
`;

const Timer = styled.div`
  margin-top: 15px;
  font-size: 1.2em;
  color: #777;
`;

const ProgressBarContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
`;
const ProgressDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
`;
const MainApp = () => {
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(4); // 4 stages of 16 data points each
  const [repeatCount, setRepeatCount] = useState(0);
  const [totalRepeats, setTotalRepeats] = useState(0);
  const [brainwaveData, setBrainwaveData] = useState([]);

  const brainwaveDataRef = useRef([]);
  const numberOfCards = sessionConfig.length;

  // Capture repeat count from query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const repeats = queryParams.get("count");
    if (repeats) {
      setTotalRepeats(parseInt(repeats, 10));
    }
  }, [location.search]);

  useEffect(() => {
    // Subscription to brainwave data
    const subscription = notion.brainwaves("raw").subscribe((data) => {
      setBrainwaveData((prevData) => {
        const updatedData = [...prevData, data];
        brainwaveDataRef.current = updatedData; // Update ref with the latest data

        // Move to the next step every 16 data points
        if (updatedData.length % 16 === 0) {
          const stage = updatedData.length / 16;
          setRemainingTime(4 - stage); // Update the remaining stages

          if (updatedData.length === 64) {
            // Save the data and reset after 64 data points
            saveAndProceed(updatedData);
          }
        }
        return updatedData;
      });
    });

    return () => subscription.unsubscribe();
  }, [stepIndex, repeatCount, numberOfCards, totalRepeats]);

  const saveAndProceed = async (data) => {
    const currentStep = sessionConfig[stepIndex];
    const sessionData = {
      session: repeatCount + 1,
      step: stepIndex + 1,
      name: "shakib",
      random: Math.floor(Math.random() * (99 - 5 + 1)) + 5,
      title: currentStep.title,
      data,
    };

    console.log("Saving Data:", sessionData); // Simulate saving the data
try {
    const response = await fetch("http://localhost:5000/save-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionData),
    });

    if (response.ok) {
      console.log("Data saved successfully.");
    } else {
      console.error("Failed to save data.");
    }
  } catch (error) {
    console.error("Error:", error);
  }

    // Move to the next card step
    const nextIndex = (stepIndex + 1) % numberOfCards;

    if (nextIndex === 0) {
      setRepeatCount((prevCount) => prevCount + 1);
    }

    // If done with repeats, navigate home; otherwise, reset
    if (repeatCount >= totalRepeats - 1 && nextIndex === 0) {
      navigate("/");
    } else {
      setStepIndex(nextIndex);
      setRemainingTime(4); // Reset stages
      setBrainwaveData([]); // Reset data array
      brainwaveDataRef.current = []; // Reset ref
    }
  };

  const currentStep = sessionConfig[stepIndex];

  return (
    <Container>
      <Flashcard>
        <h2>{currentStep.title}</h2>
        <img src={currentStep.image} alt={currentStep.title} />
        <Timer>Remaining: {remainingTime}</Timer>
      </Flashcard>
      <ProgressBarContainer>
        {sessionConfig.map((_, index) => (
          <ProgressDot key={index} />
        ))}
      </ProgressBarContainer>
    </Container>
  );
};

export default MainApp;
