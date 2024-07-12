import fs from "fs/promises";
import { tabletojson } from "tabletojson";
import { getLatestStat, updateUploadData } from "./updateConfigs";
import { emitter } from "..";
import { checkDiff } from "./checkDiff";

export async function getStat() {
  const r = await tabletojson.convertUrl("https://abit.polessu.by/monit/?select=1,1,1");

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

    resultData.data.facults_contest[
      secondTable[i]["Инженерный_3"].replaceAll("*", "")
    ] = Number(secondTable[i]["7"]);
    resultData.data.totalDocumentsByContest += Number(secondTable[i]["7"]);
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
    console.log(`Changes:\n\n${text}`);
    emitter.emit(
      "statUpdated",
      `Данные мониторинга обновлены <b>${resultData.updateDate}</b>:\n\n${
        text.length > 0 ? `${text}` : "<b>Нету изменений</b>\n\n"
      }<a href="https://abit.polessu.by/monit/?select=1,1,1">Открыть мониторинг</a>`
    );
  }
  updateUploadData(resultData);
}
