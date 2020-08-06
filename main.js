const core = require('@actions/core');
const github = require('@actions/github');

function changeGroup(str) {
  core.endGroup();
  core.startGroup(str);
}

function parseInput() {
  let p_action = core.getInput('action');
  let p_name = core.getInput('name');
  let p_value = core.getInput('value');

  const action_allowed = ['store', 'retrieve'];
  if (!action_allowed.includes(p_action.toLowerCase())) {
    throw new Error(`'action' needs to be one of ${ action_allowed.join(', ') }, got ${p_action}`);
  }

  p_action = p_action.toLowerCase();

  return {
    action: p_action,
    name: p_name,
    value: p_value,
  }
}

async function run() {
  try {
    const input = parseInput();
    const gh = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = github.context.repo;
    if (input.action === "store") {
      core.startGroup("Creating tag object");
      const { data: tag } = await gh.git.createTag({owner, repo, tag: input.name, message: input.value, object: github.context.sha, type: 'commit'});
      changeGroup("Updating ref");
      console.log(`Ref ${tag.tag}, sha ${tag.sha}`);
      try {
        await gh.git.createRef({owner, repo, ref: `refs/tags/${tag.tag}`, sha: tag.sha});
      }
      catch (error) {
        await gh.git.updateRef({owner, repo, ref: `tags/${tag.tag}`, sha: tag.sha, force: true});
      }
      core.endGroup();
    } else {
      core.startGroup("Finding ref");
      const { data: ref } = await gh.git.getRef({owner, repo, ref: `tags/${input.name}`});
      changeGroup("Getting tag");
      const { data: tag } = await gh.git.getTag({owner, repo, tag_sha: ref.object.sha});
      core.setOutput("value", tag.message);
      core.endGroup();
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
