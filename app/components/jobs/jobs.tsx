"use client";

import { JobsResponse } from "../../types/pocketbase-types";
import PocketBase, { ListResult } from "pocketbase";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "./job-card";
import { pbUrl, pbUser, pbPass } from "./helpers";
import styles from "./jobs.module.css";
import InfiniteScroll from "react-infinite-scroll-component";
import Filter from "../filter/filter";

const pb = new PocketBase(pbUrl);

interface Filters {
    tags: string[];
    locations: string[];
}
interface JobsProps {
    tag?: string;
    location?: string;
}

function Jobs({ tag, location }: JobsProps) {
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState<Filters>({
        tags: tag ? [tag] : [],
        locations: location ? [location] : [],
    });
    const [resultList, setResultList] = useState<ListResult<JobsResponse>>();
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const tagsParam = searchParams.get("tags") || "";
        const locationsParam = searchParams.get("locations") || "";
        const tags = tagsParam.split(",").filter(Boolean);
        const locations = locationsParam.split(",").filter(Boolean);
        setFilters({ tags, locations });
    }, [searchParams]);

    useEffect(() => {
        setPage(1);
        setHasMoreItems(true);
        setResultList(undefined);
        fetchJobs(1, filters);
    }, [filters]);

    const fetchJobs = async (page: number, filters: Filters) => {
        try {
            const filter = createPocketBaseQuery(filters);
            await pb.admins.authWithPassword(pbUser, pbPass);
            const newResultList: ListResult<JobsResponse> = await pb
                .collection("jobs")
                .getList(page, itemsPerPage, {
                    filter: filter,
                    sort: "-updated_ats",
                });

            if (newResultList.items.length > 0) {
                if (page === 1) {
                    setResultList(newResultList);
                } else {
                    setResultList((prevState) => ({
                        ...newResultList,
                        items: prevState
                            ? prevState.items.concat(newResultList.items)
                            : newResultList.items,
                    }));
                }
                if (newResultList.items.length < itemsPerPage) {
                    setHasMoreItems(false);
                } else {
                    setPage((prevPage) => prevPage + 1);
                }
            } else {
                setHasMoreItems(false);
            }
        } catch (error) {
            console.error("Error fetching data from PocketBase:", error);
        }
    };

    const loadMoreItems = () => {
        fetchJobs(page, filters);
    };

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
    };

    return (
        <div className={styles.jobs}>
            <Filter onFilterChange={handleFiltersChange} />
            <InfiniteScroll
                className={styles.infiniteScroll}
                dataLength={resultList?.items.length ?? 0}
                next={loadMoreItems}
                hasMore={hasMoreItems}
                loader={<h4>Loading...</h4>}
            >
                {resultList?.items.map((item: JobsResponse) => (
                    <JobCard key={item.id} job={item} />
                ))}
            </InfiniteScroll>
        </div>
    );
}

function createPocketBaseQuery(filters: Filters) {
    const { tags, locations } = filters;

    const tagsQuery =
        tags.length > 0 ? `tags ~ '${tags.join("' && tags ~ '")}'` : "";
    const locationsQuery =
        locations.length > 0
            ? `country ~ '${locations.join("' && country ~ '")}'`
            : "";
    const remoteQuery = `remote="💻 Remote"`;

    const query = [tagsQuery, locationsQuery, remoteQuery]
        .filter(Boolean)
        .join(" && ");
    return query;
}

export default Jobs;
