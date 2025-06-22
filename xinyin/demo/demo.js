import { generateWords32, importWords32 } from "./xinyin_main.js";

/**
 * @param {string} id
 * @returns HTMLInputElement
 */
function getInputElement(id) {
  const inputElement = document.getElementById(id);
  if (inputElement instanceof HTMLInputElement) {
    return inputElement;
  } else {
    throw new Error(`Input element with id "${id}" not found.`);
  }
}

/**
 * @param {string} id
 * @returns string
 */
function getInputValue(id) {
  const inputElement = getInputElement(id);
  return inputElement.value;
}

document
  .getElementById("btnGenerateWord32")
  .addEventListener("click", async () => {
    try {
      let txtInHeart = getInputValue("inputTxtInHeart");

      let startOf8105 = Number(getInputValue("inputStartOf8105"));
      if (isNaN(startOf8105)) {
        throw new Error("Start of 8105 must be a valid number.");
      }

      let countIn8105 = Number(getInputValue("inputCountIn8105"));
      if (isNaN(countIn8105)) {
        throw new Error("Count in 8105 must be a valid number.");
      }

      const words32 = await generateWords32(
        txtInHeart,
        startOf8105,
        countIn8105
      );
      const outputElement = document.getElementById("outputWord32");
      if (outputElement instanceof HTMLTextAreaElement) {
        outputElement.value = words32;
      } else {
        throw new Error('Output element with id "outputWord32" not found.');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });

document
  .getElementById("btnImportWords32")
  .addEventListener("click", async () => {
    try {
      let txtInHeart = getInputValue("inputTxtInHeart");

      let startOf8105 = Number(getInputValue("inputStartOf8105"));
      if (isNaN(startOf8105)) {
        throw new Error("Start of 8105 must be a valid number.");
      }

      let countIn8105 = Number(getInputValue("inputCountIn8105"));
      if (isNaN(countIn8105)) {
        throw new Error("Count in 8105 must be a valid number.");
      }

      let inputWords32 = getInputValue("inputWords32").trim();
      if (inputWords32.length !== 32) {
        throw new Error("Input words32 must be exactly 32 characters long.");
      }

      let address = await importWords32(
        inputWords32,
        txtInHeart,
        startOf8105,
        countIn8105,
        inputWords32
      );

      getInputElement("inputSolanaAddress").value = address;
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  });
