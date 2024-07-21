import { JobsResponse } from "../../types/pocketbase-types";

const pbUrl: string = (process.env.NEXT_PUBLIC_PB_URL ?? "").toString();
const pbUser: string = process.env.NEXT_PUBLIC_PB_USER ?? "";
const pbPass: string = process.env.NEXT_PUBLIC_PB_PASS ?? "";

function getJobImgUrl(job: JobsResponse) {
  return (
    pbUrl + "/api/files/" + job.collectionId + "/" + job.id + "/" + job.logo
  );
}

function getLastUpdated(updated: string) {
  const minsPast = covertIsoDateToMins(updated);
  const hoursPast = Math.floor(minsPast / 60);
  var timeDuration = "<1h";
  if (minsPast < 60) {
    timeDuration = "1h";
  } else if (hoursPast < 24) {
    timeDuration = hoursPast.toString() + "h";
  } else {
    timeDuration = Math.floor(hoursPast / 24).toString() + "d";
  }
  return timeDuration;
}

function covertIsoDateToMins(isoDateString: string) {
  const timeDiff = new Date().getTime() - Date.parse(isoDateString);
  return Math.floor(timeDiff / (1000 * 60));
}

export { getJobImgUrl, getLastUpdated, pbUrl, pbUser, pbPass };
