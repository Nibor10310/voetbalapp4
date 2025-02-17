import React, { useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud } from "lucide-react";

const positions = [
  "Doelman",
  "Linkervleugel",
  "Rechtervleugel",
  "Staart",
  "Piloot",
];
const totalTime = 60;
const segmentTime = 7.5;
const totalSegments = totalTime / segmentTime;

const generateRotation = (players) => {
  let schedule = [];
  let availablePlayers = players.filter(
    (player) => player.firstName && player.lastName
  );
  let playTime = Object.fromEntries(
    availablePlayers.map((player) => [
      `${player.firstName} ${player.lastName}`,
      0,
    ])
  );

  for (let i = 0; i < totalSegments; i++) {
    let segment = {};
    let selectedPlayers = availablePlayers.slice(0, 5);
    let substitutes = availablePlayers.slice(5);

    positions.forEach((position, index) => {
      segment[position] = selectedPlayers[index]
        ? `${selectedPlayers[index].firstName} ${selectedPlayers[index].lastName}`
        : "";
      if (selectedPlayers[index]) {
        playTime[
          `${selectedPlayers[index].firstName} ${selectedPlayers[index].lastName}`
        ] += segmentTime;
      }
    });

    segment["Wisselspeler(s)"] =
      substitutes.length > 0
        ? substitutes
            .map((player) => `${player.firstName} ${player.lastName}`)
            .join(", ")
        : "Geen";
    schedule.push(segment);
    availablePlayers.push(availablePlayers.shift());
  }

  return { schedule, playTime };
};

const handleFileUpload = (event, setPlayers, setPlayerCount) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const playerList = XLSX.utils
        .sheet_to_json(sheet, { header: 1 })
        .map((row) => ({ firstName: row[0] || "", lastName: row[1] || "" }))
        .filter((player) => player.firstName && player.lastName);
      setPlayers(playerList);
      setPlayerCount(playerList.length);
    };
    reader.readAsArrayBuffer(file);
  }
};

export default function RotationApp() {
  const [playerCount, setPlayerCount] = useState(5);
  const [players, setPlayers] = useState([]);
  const [rotationData, setRotationData] = useState({
    schedule: [],
    playTime: {},
  });
  const [inputPhase, setInputPhase] = useState(true);

  return (
    <div className="p-4 space-y-4">
      {inputPhase ? (
        <div>
          <h2 className="text-lg font-bold">Voer het aantal spelers in</h2>
          <p className="text-sm italic">Minimaal 5, maximaal 10 spelers.</p>
          <input
            type="number"
            className="border p-2 rounded w-20"
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
          />
          <h2 className="text-lg font-bold mt-4">
            Voer de namen van de spelers in of upload een bestand
          </h2>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 p-2 bg-blue-100 rounded-md cursor-pointer">
              <UploadCloud size={20} />
              <span>Bestand kiezen</span>
              <input
                type="file"
                accept=".csv, .xls, .xlsx"
                onChange={(e) =>
                  handleFileUpload(e, setPlayers, setPlayerCount)
                }
                className="hidden"
              />
            </label>
          </div>
          {Array.from({ length: playerCount }).map((_, index) => (
            <div key={index} className="flex space-x-2 mt-2">
              <input
                className="border p-2 rounded w-1/2"
                placeholder="Voornaam *"
                required
                value={players[index]?.firstName || ""}
                onChange={(e) => {
                  const updatedPlayers = [...players];
                  if (!updatedPlayers[index])
                    updatedPlayers[index] = { firstName: "", lastName: "" };
                  updatedPlayers[index].firstName = e.target.value;
                  setPlayers(updatedPlayers);
                }}
              />
              <input
                className="border p-2 rounded w-1/2"
                placeholder="Achternaam"
                value={players[index]?.lastName || ""}
                onChange={(e) => {
                  const updatedPlayers = [...players];
                  if (!updatedPlayers[index])
                    updatedPlayers[index] = { firstName: "", lastName: "" };
                  updatedPlayers[index].lastName = e.target.value;
                  setPlayers(updatedPlayers);
                }}
              />
            </div>
          ))}
          <button
            onClick={() => {
              setRotationData(generateRotation(players));
              setInputPhase(false);
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Start Wedstrijd
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold">Wedstrijdrotatie</h1>
          {rotationData.schedule.map((segment, index) => (
            <div key={index} className="border rounded-lg p-4 shadow-md mb-4">
              <h2 className="font-semibold">
                Moment {index + 1} (Min {index * segmentTime} -{" "}
                {index * segmentTime + segmentTime})
              </h2>
              <ul>
                {positions.map((position) => (
                  <li key={position}>
                    <strong>{position}:</strong> {segment[position]}
                  </li>
                ))}
                <li>
                  <strong>Wisselspeler(s):</strong> {segment["Wisselspeler(s)"]}
                </li>
              </ul>
            </div>
          ))}
          <h2 className="text-lg font-bold mt-4">Speeltijd per speler (%)</h2>
          <ul>
            {Object.entries(rotationData.playTime).map(([player, time]) => (
              <li key={player}>
                <strong>{player}:</strong>{" "}
                {((time / totalTime) * 100).toFixed(2)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
