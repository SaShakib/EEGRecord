import React, { useState, useEffect } from "react";
import { navigate } from "@reach/router";

import { notion, useNotion } from "../services/notion";
import { Nav } from "../components/Nav";
import styled from "styled-components";

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;

  input {
    width: 300px;
    padding: 8px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1em;
    text-align: center;
  }

  button {
    padding: 10px 20px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 1em;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: #45a049;
    }
  }
`;
export function Calm() {
  const { user } = useNotion();
  const [calm, setCalm] = useState(0);
  const [minutes, setMinutes] = useState("");
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user]);

  useEffect(() => {
    if (!user || !isTraining) {
      return;
    }

    const subscription = notion.calm().subscribe((calm) => {
      const calmScore = Math.trunc(calm.probability * 100);
      setCalm(calmScore);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isTraining]);

  const handleStart = () => {
    if (parseInt(minutes) > 0) {
      setIsTraining(true);
      navigate(`/start?count=${minutes}`);
    } else {
      alert("Please enter a valid number.");
    }
  };

  return (
    <main className="main-container">
      {user ? <Nav /> : null}
      {!isTraining ? (
        <InputContainer>
          <label>Training repetation :</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="1"
            placeholder="Enter repeat amount"
            className="minutes-input"
          />
          <button onClick={handleStart} className="start-button">
            Start Training
          </button>
        </InputContainer>
      ) : (
        <div className="calm-score">
          &nbsp;{calm}% <div className="calm-word">Calm</div>
        </div>
      )}
    </main>
  );
}
