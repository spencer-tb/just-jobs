import { notFound } from "next/navigation";
import Link from "next/link";
import { getNiche } from "@/lib/niche";
import { getJobById } from "@/lib/db";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return { title: "Job Not Found" };

  const niche = getNiche();
  return {
    title: niche.seo.titleTemplate.replace("%s", `${job.title} at ${job.hiringOrganization.name}`),
    description: `${job.title} at ${job.hiringOrganization.name}${job.jobLocation?.address ? ` in ${job.jobLocation.address}` : ""}. Apply now.`,
  };
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const niche = getNiche();
  const isRemote = job.jobLocationType === "TELECOMMUTE";

  // JSON-LD — reads directly from Job fields (already Google JobPosting-aligned)
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || `${job.title} at ${job.hiringOrganization.name}`,
    datePosted: job.datePosted,
    ...(job.validThrough && { validThrough: job.validThrough }),
    ...(job.employmentType && { employmentType: job.employmentType }),
    hiringOrganization: {
      "@type": "Organization",
      name: job.hiringOrganization.name,
      ...(job.hiringOrganization.sameAs && { sameAs: job.hiringOrganization.sameAs }),
      ...(job.hiringOrganization.logo && { logo: job.hiringOrganization.logo }),
    },
    ...(job.jobLocation && !isRemote && {
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          ...(job.jobLocation.address && { addressLocality: job.jobLocation.address }),
          ...(job.jobLocation.addressRegion && { addressRegion: job.jobLocation.addressRegion }),
          ...(job.jobLocation.addressCountry && { addressCountry: job.jobLocation.addressCountry }),
          ...(job.jobLocation.postalCode && { postalCode: job.jobLocation.postalCode }),
        },
      },
    }),
    ...(isRemote && { jobLocationType: "TELECOMMUTE" }),
    ...(job.baseSalary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.baseSalary.currency,
        value: {
          "@type": "QuantitativeValue",
          ...(job.baseSalary.minValue != null && { minValue: job.baseSalary.minValue }),
          ...(job.baseSalary.maxValue != null && { maxValue: job.baseSalary.maxValue }),
          unitText: job.baseSalary.unitText,
        },
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back to all jobs
        </Link>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mt-2">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-lg text-gray-700 mt-1">{job.hiringOrganization.name}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            {job.jobLocation?.address && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {job.jobLocation.address}
              </span>
            )}
            {isRemote && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Remote
              </span>
            )}
            {job.employmentType && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {job.employmentType.replace("_", " ")}
              </span>
            )}
            {job.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag.replace("-", " ")}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
            {job.datePosted && (
              <span>
                Posted{" "}
                {new Date(job.datePosted).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="capitalize">via {job.source}</span>
          </div>

          {job.baseSalary && (
            <p className="mt-2 text-sm text-gray-600">
              {job.baseSalary.currency}{" "}
              {job.baseSalary.minValue != null && job.baseSalary.maxValue != null
                ? `${job.baseSalary.minValue.toLocaleString()} – ${job.baseSalary.maxValue.toLocaleString()}`
                : job.baseSalary.minValue != null
                  ? `from ${job.baseSalary.minValue.toLocaleString()}`
                  : job.baseSalary.maxValue != null
                    ? `up to ${job.baseSalary.maxValue.toLocaleString()}`
                    : ""}
              {" "}/ {job.baseSalary.unitText.toLowerCase()}
            </p>
          )}

          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 px-6 py-3 rounded-md text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: niche.theme.primaryColor }}
          >
            Apply on original site &rarr;
          </a>

          {job.description && (
            <div
              className="mt-8 prose prose-sm max-w-none border-t pt-6"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          )}
        </div>
      </div>
    </>
  );
}
