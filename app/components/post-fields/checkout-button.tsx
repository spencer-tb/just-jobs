"use client";

import { useState } from "react";
import { getRecord } from "./get-record";
import { checkRequiredFieldsFilled } from "./field-validation";
import { JobsRecord } from "../../types/pocketbase-types";
import { loadStripe } from "@stripe/stripe-js";

const stripeKey =
    process.env.REACT_APP_DEBUG === "true"
        ? process.env.REACT_APP_STRIPE_TEST_PUBLIC_KEY
        : process.env.REACT_APP_STRIPE_PUBLIC_KEY;

const stripePromise = loadStripe(stripeKey!);

function CheckoutButton({
    jobsFormData,
    company_logo,
}: {
    jobsFormData: JobsRecord;
    company_logo: File | undefined;
}) {
    // Dynamically set the amount to charge
    const [amount, setAmount] = useState(10);
    const [message, setMessage] = useState<string>("");

    let isGettingRecord = false;

    const handleClick = async (
        event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => {
        // Prevent default behavior
        event.preventDefault();

        // Check if required fields are filled
        if (!process.env.REACT_APP_DEBUG) {
            const message = checkRequiredFieldsFilled(jobsFormData);
            if (message) {
                setMessage(message);
                return; // return early if validation fails
            }
        }

        if (isGettingRecord) return; // Prevents getRecord being called again while it's still processing
        isGettingRecord = true;

        try {
            // Create a record object to send to the backend along with the price selected
            const record = await getRecord(amount, jobsFormData, company_logo);
            const response = await fetch(
                "https://aiwillnotkillus.com/create-checkout-session",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(record),
                }
            );

            // Get the session ID from the backend response
            const session = await response.json();

            // Redirect user to Stripe Checkout Session
            const stripe = await stripePromise;
            const result = await stripe?.redirectToCheckout({
                sessionId: session.id,
            });
            if (result?.error) {
                alert(result.error.message);
            }
        } finally {
            isGettingRecord = false;
        }
    };

    return (
        <div className="checkout-button-container">
            {message && <p className="error-message">{message}</p>}
            <button className="checkout-button" onClick={handleClick}>
                Start Hiring
            </button>
        </div>
    );
}

export default CheckoutButton;
