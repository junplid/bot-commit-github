const axios = require("axios");
const { readFileSync } = require("fs");

const owner = "";
const repo = "";
const file = "data.json";
const token = "";
const headers = { Authorization: `token ${token}` };

const createCommit = async () => {
  const latestCommitSha = await getLatestCommitSha(owner, repo);
  const treeSha = await createTree(
    owner,
    repo,
    latestCommitSha,
    file,
    readFileSync(file, "utf-8")
  );

  const newCommitSha = await createCommitApi(
    owner,
    repo,
    treeSha,
    latestCommitSha
  );

  console.log("Novo commit criado:", newCommitSha);
  return newCommitSha;
};

const getLatestCommitSha = async (owner, repo) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`,
      { headers }
    );
    return response.data.object.sha;
  } catch (error) {
    console.error("Erro ao obter referência do último commit:", error.message);
    throw error;
  }
};

const createTree = async (owner, repo, baseTreeSha, filePath, content) => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        base_tree: baseTreeSha,
        tree: [
          { path: filePath, mode: "100644", type: "blob", content: content },
        ],
      },
      { headers }
    );
    return response.data.sha;
  } catch (error) {
    console.error("Erro ao criar nova árvore:", error.message);
    throw error;
  }
};

const createCommitApi = async (owner, repo, treeSha, parentCommitSha) => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      { message: "up", tree: treeSha, parents: [parentCommitSha] },
      { headers }
    );
    return response.data.sha;
  } catch (error) {
    console.error("Erro ao criar novo commit:", error.message);
    throw error;
  }
};

const updateBranchRef = async (owner, repo, newCommitSha) => {
  try {
    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      { sha: newCommitSha, force: true },
      { headers: { Authorization: `token ${token}` } }
    );
  } catch (error) {
    console.log(error);
    console.error("Erro ao atualizar a referência da branch:", error.message);
    throw error;
  }
};

(async () => {
  try {
    const newCommitSha = await createCommit();
    await updateBranchRef(owner, repo, newCommitSha);
    console.log("Push realizado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar e fazer push do commit:", error.message);
  }
})();
