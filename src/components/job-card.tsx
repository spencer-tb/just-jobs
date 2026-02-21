import type { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
  nicheColor: string;
}

export function JobCard({ job, nicheColor }: JobCardProps) {
  const postedDate = job.datePosted
    ? new Date(job.datePosted).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const isRemote = job.jobLocationType === "TELECOMMUTE";

  return (
    <a
      href={`/jobs/${job.id}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">{job.title}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{job.hiringOrganization.name}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {job.jobLocation?.address && (
              <span className="text-xs text-gray-500">{job.jobLocation.address}</span>
            )}
            {isRemote && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                Remote
              </span>
            )}
            {job.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${nicheColor}15`, color: nicheColor }}
              >
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          {postedDate && (
            <span className="text-xs text-gray-400">{postedDate}</span>
          )}
          <p className="text-xs text-gray-400 mt-1 capitalize">{job.source}</p>
        </div>
      </div>
    </a>
  );
}
