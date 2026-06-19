// IFTTT filter script — appends completed Linear issues to a daily Dropbox file.
//
// Usage:
//   1. In your IFTTT applet, add a "Dropbox → Append to a text file" action.
//   2. Add this script as the filter code in the applet editor.
//   3. The script ignores events that are not completed issues ("Done" state)
//      and formats them with identifiers, labels, and description.

const payload = JSON.parse(MakerWebhooks.jsonEvent.JsonPayload);

if (payload["type"] !== "Issue" || payload["data"]["state"]["name"] !== "Done") {
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
  body += " " + labels.map((l: { name: string}) => {
    const slug = l.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `#${slug}`;
  }).join(" ");
}

const description = issue.description;
if (description !== null && description !== undefined && description.trim() !== '') {
  body = body + "\n\n" + description.trim().replace(/^/gm, '    ');
}

Dropbox.appendToTextFileDb.setFilename(
  `Completed Tasks on ${Meta.currentUserTime.format("YYYY-MM-DD")}`
);
Dropbox.appendToTextFileDb.setBody(body);
