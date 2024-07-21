"use client";

import { JobsResponse } from "../../types/pocketbase-types";
import PocketBase, { ListResult } from "pocketbase";
import { useState, useEffect } from "react";
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

function Jobs() {
    const [filters, setFilters] = useState<Filters>({
        tags: [],
        locations: [],
    });
    const [resultList, setResultList] = useState<ListResult<JobsResponse>>();
    const [hasMoreItems, setHasMoreItems] = useState(true);
    const [page, setPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        setPage(1);
        setHasMoreItems(true);
        fetchJobs();
    }, [filters]);

    const fetchJobs = async () => {
        if (!hasMoreItems) {
            // All items have been fetched, no need to fetch again
            return;
        }
        try {
            const filter = createPocketBaseQuery(filters);
            await pb.admins.authWithPassword(pbUser, pbPass);
            console.log(filter);
            const newResultList: ListResult<JobsResponse> = await pb
                .collection("jobs")
                .getList(page, itemsPerPage, {
                    filter: filter,
                    sort: "-updated_ats",
                });
            if (newResultList.items.length > 0) {
                if (page === 1) {
                    // This is the first page, replace the result list
                    setResultList(newResultList);
                } else {
                    // This is a subsequent page, append to the result list
                    setResultList((prevState) => ({
                        ...newResultList,
                        items: prevState
                            ? prevState.items.concat(newResultList.items)
                            : newResultList.items,
                    }));
                }

                if (newResultList.items.length < itemsPerPage) {
                    setHasMoreItems(false); // we've reached the end
                } else {
                    setPage((prevPage) => prevPage + 1); // increment the page only if there are more items
                }
            } else {
                setHasMoreItems(false); // we've reached the end
            }
        } catch (error) {
            console.error("Error fetching data from PocketBase:", error);
        }
    };

    const loadMoreItems = () => {
        fetchJobs();
    };

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        setResultList(undefined);
        setPage(1);
    };

    return (
        <div className={styles.jobs}>
            <Filter onFilterChange={handleFiltersChange} />
            <InfiniteScroll
                className={styles.infiniteScroll}
                dataLength={resultList?.items.length ?? 0}
                next={loadMoreItems}
                hasMore={
                    resultList?.items?.length !== undefined &&
                    resultList?.items?.length > 0
                }
                loader={""}
            >
                {resultList?.items.map((item: JobsResponse) => (
                    <JobCard key={item.id} job={item} />
                ))}
            </InfiniteScroll>
        </div>
    );
}

// Helper query function, creates a pocketbase filter query
function createPocketBaseQuery(filters: Filters) {
    const { tags, locations } = filters;

    // and'd filter logic
    const tagsQuery =
        tags.length > 0 ? `tags ~ '${tags.join("' && tags ~ '")}'` : "";
    const locationsQuery =
        locations.length > 0
            ? `country ~ '${locations.join("' && country ~ '")}'`
            : "";
    const remoteQuery = `remote="💻 Remote"`;

    // filter query to pb
    const query = [tagsQuery, locationsQuery, remoteQuery]
        .filter(Boolean)
        .join(" && ");
    return query;
}

export default Jobs;
