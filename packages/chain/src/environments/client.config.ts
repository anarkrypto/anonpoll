import { AuroSigner, ClientAppChain } from "@proto-kit/sdk";
import runtime from "../runtime";
import { container } from "tsyringe";
import {
	ProvableBlockHook,
	ProvableTransactionHook
} from "@proto-kit/protocol";

const appChain = ClientAppChain.fromRuntime(runtime.modules, AuroSigner);

appChain.configurePartial({
	Runtime: runtime.config
});

appChain.configurePartial({
	GraphqlClient: {
		url: process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL
	}
});

export const client = appChain;

// This is a workaround for the following error:
// Uncaught (in promise) Error: Cannot inject the dependency "n" at position #2 of "eX" constructor. Reason:
//     Attempted to resolve unregistered dependency token: "ProvableTransactionHook" | "ProvableBlockHook"
container.registerInstance("ProvableTransactionHook", ProvableTransactionHook);
container.registerInstance("ProvableBlockHook", ProvableBlockHook);
