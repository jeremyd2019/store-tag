const core = require('@actions/core');
const github = require('@actions/github');

function changeGroup(str) {
  core.endGroup();
  core.startGroup(str);
}

function parseInput() {
  let p_name = core.getInput('name');
  let p_value = core.getInput('value');

  return {
    name: p_name,
    value: p_value,
  }
}

async function run() {
  try {
    const input = parseInput();
    const gh = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = github.context.repo;
    core.startGroup("Creating tag object");
    const { data: tag } = await gh.git.createTag({owner, repo, tag: input.name, message: input.value, object: github.context.sha, type: 'commit'});
    changeGroup("Updating ref");
    await gh.git.updateRef({owner, repo, ref: `refs/tags/${tag.tag}`, sha: tag.sha, force: true});
    core.endGroup();
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
