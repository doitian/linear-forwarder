// Add your code here. All actions will run unless you explicitly skip them.
// Quick tips!
// Auto-complete is on. Start typing to see ingredient options.
// Hover over any ingredient to see the data type and an example.
// F1 to list keyboard shortcuts.
// TypeScript v2.92

const payload = JSON.parse(MakerWebhooks.jsonEvent.JsonPayload);

if (
  payload["type"] !== "Issue" ||
  payload["data"]["state"]["name"] !== "Done" ||
  payload["updatedFrom"] === undefined ||
  payload["updatedFrom"]["stateId"] === undefined
) {
  Dropbox.appendToTextFileDb.skip("Ignore events other than completed issues");
}

const issue = payload["data"];

let body = `- ✅ ${Meta.currentUserTime.format("HH:mm")} [${issue.identifier}](${issue.url}) ${issue.title}`;

const project = issue.project;
if (project && project.name) {
  body += ` (**u**::[[♯ ${project.name}]])`;
}

const labels = issue.labels;
if (labels && labels.length > 0) {
  body +=
    " " +
    labels
      .map((l: { name: string }) => {
        const slug = l.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        return `#${slug}`;
      })
      .join(" ");
}

const description = issue.description;
if (
  description !== null &&
  description !== undefined &&
  description.trim() !== ""
) {
  body = body + "\n\n" + description.trim().replace(/^/gm, "    ");
}

Dropbox.appendToTextFileDb.setFilename(
  `Completed Tasks on ${Meta.currentUserTime.format("YYYY-MM-DD")}`,
);
Dropbox.appendToTextFileDb.setBody(body);
