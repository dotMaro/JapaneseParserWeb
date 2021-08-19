import React, { useCallback, useState, FC } from "react";
import "./App.css";
import axios from "axios";
import PuffLoader from "react-spinners/PuffLoader";
import styled from "styled-components";

interface ParseResult {
  original: string;
  definitions: Definition[] | null;
}

interface Definition {
  entry: Entry;
  conjugation?: Conjugation;
}

interface Conjugation {
  ending: string;
  base: string;
  pos: string;
  name: string;
}

interface Entry {
  kanji: string[] | null;
  readings: string[];
  sense: Sense[];
}

interface Sense {
  glossary: string[];
  pos: string[] | null;
}

type WordProps = {
  index: number;
  isSelected: boolean;
  isSameAsSelectedWord: boolean;
};

const Word = styled.span<WordProps>`
  color: ${(props) => wordColors[props.index % wordColors.length]};
  text-decoration: ${(props) =>
    props.isSelected
      ? "underline dashed"
      : props.isSameAsSelectedWord
      ? "underline dotted"
      : "none"};
  // font-weight: ${(props) => (props.isSelected ? "bold" : "normal")};
  text-underline-offset: 5px;
`;

const Sentence = styled.div`
  width: 70%;
  text-align: center;
  margin: auto;
`;

const ConjugationName = styled.div`
  font-size: calc(10px + 1vmin);
  width: 70%;
  margin: auto;
`;

interface WordDefinitionProps {
  def: Definition;
}

const WordDefinition: FC<WordDefinitionProps> = ({ def }) => {
  return (
    <div>
      <div>
        <span>{def.entry.kanji?.map((kanji) => kanji + " ")}</span>
      </div>
      <div>
        <span>{def.entry.readings?.map((reading) => reading + " ")}</span>
      </div>
      {def.conjugation !== undefined ? (
        <ConjugationName>{def.conjugation.name}</ConjugationName>
      ) : null}
      <div>
        {def.entry.sense.map((sense, index) => (
          <Meaning index={index} sense={sense} key={index} />
        ))}
      </div>
    </div>
  );
};

interface MeaningProps {
  index: number;
  sense: Sense;
}

const Meaning: FC<MeaningProps> = ({ index, sense }) => {
  return (
    <div>
      {index + 1 + ". " + sense.glossary.map((glossary) => " " + glossary)}
    </div>
  );
};

const wordColors = ["#9C344C", "#AA5F39", "#267158", "#579532"];

function App() {
  let [loading, setLoading] = useState<boolean>(false);
  let [error, setError] = useState<string>("");
  let [parseResp, setParseResp] = useState<Array<ParseResult>>();
  let [selectedWord, setSelectedWord] = useState<ParseResult>();
  let [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleInputKeyPress = useCallback(
    (event) => {
      if (event.key !== "Enter") {
        return;
      }
      setLoading(true);
      axios
        .post("http://localhost:8080/parse", {
          sentence: event.target.value,
        })
        .then((response) => {
          setParseResp(response.data);
          setLoading(false);
          setError("");
          console.log(response);
        })
        .catch((resp) => {
          setLoading(false);
          setError("Failed to make request to backend");
          console.error(resp);
        });
    },
    [setLoading, setError]
  );

  const handleAppKeyPress = useCallback(
    (event) => {
      if (event.target.tagName.toLowerCase() === "input") {
        return;
      }
      switch (event.key) {
        case "ArrowRight":
          if (parseResp !== undefined && selectedIndex < parseResp.length - 1) {
            let newIndex = selectedIndex + 1;
            setSelected(parseResp[newIndex], newIndex);
          }
          break;
        case "ArrowLeft":
          if (parseResp !== undefined && selectedIndex > 0) {
            let newIndex = selectedIndex - 1;
            setSelected(parseResp[newIndex], newIndex);
          }
          break;
      }
    },
    [parseResp, selectedIndex]
  );

  function setSelected(word: ParseResult, index: number) {
    setSelectedWord(word);
    setSelectedIndex(index);
  }

  return (
    <div className="App" onKeyDown={handleAppKeyPress} tabIndex={-1}>
      <header className="App-header">
        <p>Japanese Parser</p>
        <input className="Input" onKeyPress={handleInputKeyPress} />
      </header>
      <main>
        <PuffLoader loading={loading} color={"#36d7b7"} speedMultiplier={2} />
        {error !== "" ? <p id="Error">{error}</p> : null}
        <Sentence>
          {parseResp?.map((word: ParseResult, index: number) => (
            <Word
              onClick={() => setSelected(word, index)}
              index={index}
              isSameAsSelectedWord={word.original === selectedWord?.original}
              isSelected={index === selectedIndex}
              key={index}
            >
              {word.original}
            </Word>
          ))}
        </Sentence>
        <div>
          {selectedWord !== undefined && selectedWord.definitions !== null
            ? selectedWord.definitions.map((def, index) => (
                <WordDefinition def={def} key={index} />
              ))
            : null}
        </div>
      </main>
    </div>
  );
}

export default App;
