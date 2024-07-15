import { tabletojson } from "tabletojson";
import { emitter } from "../index";
import { checkDiff } from "./checkDiff";
import { getLatestStat, updateUploadData } from "./updateConfigs";
import { updateSpecStat } from "./updateFacultsStat";
import fs from "fs/promises";
import path from "path";

export async function getStat() {
  //https://abit.polessu.by/monit/?select=1,1,1
  const r = await tabletojson.convertUrl(
    "https://abit.polessu.by/monit/?select=1,1,1"
  );

  const oldStat = getLatestStat();

  const updateDate = `${r[0][1]["0"]} ${r[0][1]["1"]}`;

  const secondTable = r[1];

  let resultData: Record<string, any> = {
    updateDate: updateDate || "Ошибка получения даты",
    data: {
      totalDocumentsByContest: 0,
      facults_contest: {},
    },
  };

  for (let i = 0; i < secondTable.length; i++) {
    if (i < 2) continue;

    const docsCount = Number(secondTable[i]["План приема"]);

    resultData.data.facults_contest[
      secondTable[i]["Инженерный_3"].replaceAll("*", "")
    ] = isNaN(docsCount) ? 0 : docsCount;
    resultData.data.totalDocumentsByContest += isNaN(docsCount) ? 0 : docsCount;
  }

  if (oldStat.updateDate !== updateDate) {
    const changedKeys = checkDiff(
      oldStat.data.facults_contest,
      resultData.data.facults_contest
    );

    let text = ``;

    changedKeys.forEach((value) => {
      const diff =
        resultData.data.facults_contest[value] -
        //@ts-ignore
        Number(oldStat.data.facults_contest[value]);
      text += `${value}: ${resultData.data.facults_contest[value]} <b>${
        diff < 0 ? `(${diff})` : `(+${diff})`
      }</b>\n`;
    });
    emitter.emit(
      "statUpdated",
      `Данные мониторинга обновлены <b>${resultData.updateDate}</b>:\n\n${
        text.length > 0 ? `${text}` : "<b>Нету изменений</b>\n\n"
      }${
        text.length > 0
          ? "\n\n<b>Данные по специальностям обновлены (/spec)</b>"
          : ""
      }\n<a href="https://abit.polessu.by/monit/?select=1,1,1">Открыть мониторинг</a>`
    );
  }
  updateUploadData(resultData);
  updateSpecStat(secondTable, updateDate);
}
