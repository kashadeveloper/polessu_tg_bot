import { BALL_COLS_NAMES, SPECS_ID } from "./../constants";
import fs from "fs/promises";
import path from "path";
import moment from "moment";

export async function updateSpecStat(
  data: Record<string, any>,
  updateDate?: string
) {
  const result: Record<string, any> = {
    updateTime: updateDate || moment().format("DD.MM.YYYY HH:mm"),
    data: {},
  };

  for (let i = 0; i < data.length; i++) {
    if (i < 2) continue;
    result.data[SPECS_ID[i - 1]] = {
      withoutContest: 0,
      contest: {},
    };
    let withoutContestField = `${data[i][5].length ? data[i][5] : "0"} | ${
      data[i][6].length ? data[i][6] : "0"
    }`;
    result.data[SPECS_ID[i - 1]]["withoutContest"] = withoutContestField;
    for (let j = 8; j < 78; j++) {
      const rowValue = Number(data[i][j]);
      if (isNaN(rowValue))
        result.data[SPECS_ID[i - 1]]["contest"][BALL_COLS_NAMES[j]] = 0;
      else
        result.data[SPECS_ID[i - 1]]["contest"][BALL_COLS_NAMES[j]] = rowValue;
    }
  }

  return await fs.writeFile(
    path.join(__dirname, "../../facults_data.json"),
    JSON.stringify(result, undefined, "\t")
  );
}

export async function getSpecData(id?: number) {
  const result = await fs.readFile(
    path.join(__dirname, "../../facults_data.json"),
    "utf8"
  );

  const parsedResult = JSON.parse(result);

  if (!id) return parsedResult;

  return {
    updateTime: parsedResult.updateTime,
    data: parsedResult.data[SPECS_ID[id]],
  };
}
