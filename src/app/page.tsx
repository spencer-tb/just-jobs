import { getNiche } from "@/lib/niche";
import { getJobs } from "@/lib/db";
import { JobCard } from "@/components/job-card";
import { SearchBar } from "@/components/search-bar";
import { TagFilter } from "@/components/tag-filter";

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string; remote?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const niche = getNiche();
  const page = parseInt(params.page || "1", 10);

  const { jobs, total } = await getJobs({
    niche: niche.id,
    query: params.q,
    tags: params.tag ? [params.tag] : undefined,
    remote: params.remote === "true",
    page,
    limit: 20,
  });

  const totalPages = Math.ceil(total / 20);
  const tagNames = Object.keys(niche.tags);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{niche.name}</h1>
        <p className="text-gray-600">{niche.seo.description}</p>
      </div>

      <SearchBar defaultValue={params.q} />
      <TagFilter tags={tagNames} activeTag={params.tag} isRemote={params.remote === "true"} />

      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-4">
          {total} {total === 1 ? "job" : "jobs"} found
        </p>

        {jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No jobs found</p>
            <p className="mt-2">Try broadening your search or removing filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} nicheColor={niche.theme.primaryColor} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            <span className="px-4 py-2 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
