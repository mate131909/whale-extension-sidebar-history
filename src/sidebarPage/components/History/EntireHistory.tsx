import React, { useState, useEffect } from "react";

import { SectionContainer } from "../../common";
import DateSelector from "./DateSelector";
import HistoryList from "./HistoryList";

type Props = {};

function EntireHistory() {
  const TODAY_MIDNIGHT = new Date(new Date(Date.now()).setHours(0, 0, 0, 0));
  // history.search 에 쓰일 startDate (startDate 이후 기록만 검색됨)
  const [startDate, setStartDate] = useState<Date>(new Date(TODAY_MIDNIGHT));
  const [historys, setHistorys] = useState<whale.history.HistoryItem[]>([]);

  function updateHistoryList() {
    // startDate(현재 선택된 날짜) 하루 동안 방문한 기록만 검색하기 위해
    // 선택된 날짜 하루 뒤를 endDate 로 정의
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    // startDate(현재 선택된 날짜의 0시) ~ endDate(24시간 뒤)
    // 까지의 기록을 검색
    whale.history.search(
      {
        text: "",
        maxResults: 0,
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
      },
      (results: whale.history.HistoryItem[]) => {
        setHistorys(results);
      },
    );
  }

  // 맨 처음 한번만 실행
  useEffect(() => {
    // 방문 기록이 추가될때 재로딩
    whale.history.onVisited.addListener(() => {
      updateHistoryList();
    });
  }, []);

  useEffect(() => {
    updateHistoryList();
  }, [startDate]);

  function onStartDateChange(date: Date) {
    setStartDate(date);
  }

  // console.log("EntireHistory", historys);

  return (
    <SectionContainer
      id="entire-history"
      title={
        whale.i18n.getMessage("history__entire_history") ||
        "history__entire_history"
      }
      option={
        // eslint-disable-next-line react/jsx-wrap-multilines
        <DateSelector
          TODAY={TODAY_MIDNIGHT.getTime()}
          onSelect={onStartDateChange}
        />
      }
      collapsibleConfigure={{
        defaultStatus: true,
        isFixed: true,
      }}
    >
      <HistoryList
        historys={historys}
        fallbackMessage={
          whale.i18n.getMessage("history__entire_history__no_history_data") ||
          "history__entire_history__no_history_data"
        }
      />
    </SectionContainer>
  );
}

export default EntireHistory;