import moment from "moment";
import { tabletojson } from "tabletojson";
import { emitter } from "../index";
import { checkDiff } from "./checkDiff";
import { num_word } from "./num_word";
import { getLatestStat, updateUploadData } from "./updateConfigs";
import { updateSpecStat } from "./updateFacultsStat";

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

    const a_date = moment(new Date());
    const b_date = moment({
      hour: 18,
      minute: 0,
      day: 17,
      month: 6,
      year: 2024,
    });

    const endDateFormat =
      b_date.diff(a_date, "h") > 0
        ? `${b_date.diff(a_date, "h")} ${num_word(b_date.diff(a_date, "h"), [
            "час",
            "часа",
            "часов",
          ])}`
        : `${
            b_date.diff(a_date, "minute") > 0
              ? `${b_date.diff(a_date, "minute")} ${num_word(
                  b_date.diff(a_date, "minutes"),
                  ["минута", "минуты", "минут"]
                )}`
              : `меньше минуты`
          }`;

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
        b_date.diff(a_date) > 0
          ? `До окончания срока подачи документов: <b>${endDateFormat}</b>\n\n`
          : `<b>Подача документов завершена 🎉</b>\n\n`
      }${text.length > 0 ? `${text}` : "<b>Нету изменений</b>\n\n"}${
        text.length > 0
          ? "\n\n<b>Данные по специальностям обновлены (/spec)</b>"
          : ""
      }\n<a href="https://abit.polessu.by/monit/?select=1,1,1">Открыть мониторинг</a>`
    );
  }
  updateUploadData(resultData);
  updateSpecStat(secondTable, updateDate);
}
