import React, { useState, useEffect } from "react";
import { sessionConfig } from "../config";
import styled from "styled-components";
import { useLocation, navigate } from "@reach/router";
import { notion } from "../services/notion";

const MainApp = () => {
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(4000); // 4 seconds per card
  const [repeatCount, setRepeatCount] = useState(0);
  const [totalRepeats, setTotalRepeats] = useState(0);
  const [brainwaveData, setBrainwaveData] = useState([]); // Stores data for each 4-second interval

  const numberOfCards = sessionConfig.length; // Number of cards in the session

  // Styled Components
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
    background-color: ${(props) => (props.isActive ? "#4CAF50" : "#ddd")};
  `;

  // Capture repeat count from query params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const repeats = queryParams.get("count");

    if (repeats) {
      setTotalRepeats(parseInt(repeats, 10));
    }
  }, [location.search]);

  useEffect(() => {
    const subscription = notion.brainwaves("raw").subscribe((data) => {
      setBrainwaveData((prevData) => [...prevData, data]);
    });

    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime > 1000) {
          return prevTime - 1000;
        } else {
          // Save the data for the current card interval
          saveBrainwaveData();

          // Move to the next step
          const nextIndex = (stepIndex + 1) % numberOfCards;

          // If reached the end of the cards, increment repeat count
          if (nextIndex === 0) {
            setRepeatCount((prevCount) => prevCount + 1);
          }

          // Check if we need to stop after reaching the total repeats
          if (repeatCount >= totalRepeats - 1 && nextIndex === 0) {
            clearInterval(timer); // Stop the timer after completing repeats
            subscription.unsubscribe();
            navigate("/"); // Redirect to home page
            return 0;
          } else {
            setStepIndex(nextIndex);
            return 4000; // Reset time to 4 seconds for the next card
          }
        }
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      subscription.unsubscribe();
    };
  }, [stepIndex, repeatCount, numberOfCards, totalRepeats]);

  // Save the brainwave data after each 4-second interval
  const saveBrainwaveData = () => {
    const currentStep = sessionConfig[stepIndex];
    const sessionData = {
      session: repeatCount + 1,
      step: stepIndex + 1,
      title: currentStep.title,
      data: brainwaveData,
    };

    // Simulating save to file/database
    console.log("Saving data:", sessionData);

    // Clear brainwaveData for the next interval
    setBrainwaveData([]);
  };

  const currentStep = sessionConfig[stepIndex];

  return (
    <Container>
      <Flashcard>
        <h2>{currentStep.title}</h2>
        <img src={currentStep.image} alt={currentStep.title} />
        <Timer>Remaining: {Math.floor(remainingTime / 1000)} sec</Timer>
      </Flashcard>
      <ProgressBarContainer>
        {sessionConfig.map((_, index) => (
          <ProgressDot key={index} isActive={index === stepIndex} />
        ))}
      </ProgressBarContainer>
    </Container>
  );
};

export default MainApp;
