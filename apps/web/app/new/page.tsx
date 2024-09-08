import { Metadata } from "next";
import { PollForm } from "./poll-form";

export const metadata: Metadata = {
    title: "New Poll",
}

export default function PollFormPage () {
    return (<PollForm />);
}