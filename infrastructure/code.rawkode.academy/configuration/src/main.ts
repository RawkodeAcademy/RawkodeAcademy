import type { Construct } from "constructs";
import { App, GcsBackend, TerraformStack } from "cdktf";
import { group, groupLabel, provider } from "../.gen/providers/gitlab";
import { GroupIssueBoard } from "../.gen/providers/gitlab/group-issue-board";

const workflowLabels = (scope: Construct, groupId: string) => {
	return [
		new groupLabel.GroupLabel(scope, "workflow-triage", {
			name: "Workflow::Triage",
			color: "#f2f2f2",
			group: groupId,
			description: "This item is in triage and needs to be reviewed.",
		}),
		new groupLabel.GroupLabel(scope, "workflow-icebox", {
			name: "Workflow::Icebox",
			color: "#f2f2f2",
			group: groupId,
			description: "This item is currently frozen with no plans to work on it.",
		}),
		new groupLabel.GroupLabel(scope, "workflow-backlog", {
			name: "Workflow::Backlog",
			color: "#f2f2f2",
			group: groupId,
			description:
				"This item is in the backlog and will be worked on in the future.",
		}),
		new groupLabel.GroupLabel(scope, "workflow-in-progress", {
			name: "Workflow::In Progress",
			color: "#f2f2f2",
			group: groupId,
			description: "This item is currently being worked on.",
		}),
		new groupLabel.GroupLabel(scope, "workflow-under-review", {
			name: "Workflow::Under Review",
			color: "#f2f2f2",
			group: groupId,
			description: "This item is currently under review.",
		}),
	];
};

class MyStack extends TerraformStack {
	constructor(scope: Construct, id: string) {
		super(scope, id);

		new GcsBackend(this, {
			bucket: "rawkode-academy-iac",
			prefix: "code.rawkode.academy",
		});

		const gitlab = new provider.GitlabProvider(this, "gitlab", {
			baseUrl: "https://code.rawkode.academy",
		});

		const gr = new group.Group(gitlab, "rawkode-academy", {
			name: "Rawkode Academy",
			path: "RawkodeAcademy",
			autoDevopsEnabled: false,
			description: "Rawkode Academy",
			wikiAccessLevel: "disabled",
			permanentlyRemoveOnDelete: false,
			defaultBranch: "main",
			visibilityLevel: "public",
		});

		const groupLabels = workflowLabels(gr, gr.id);

		let counter = 0;
		new GroupIssueBoard(gr, "rawkode-academy-issue-board", {
			name: "Development",
			group: gr.id,
			lists: groupLabels.map((label) => ({
				labelId: label.labelId,
				position: counter++,
			})),
		});
	}
}

const app = new App();
new MyStack(app, "configuration");
app.synth();
