// Array que armazenará os usuários carregados da API
let usuarios = [];

// Página inicial da tabela
let paginaAtual = 1;

// Define quantos usuários serão exibidos por página
const usuariosPorPagina = 20;

// Define o campo e a ordem (crescente ou decrescente) para a ordenação
let ordemAtual = { campo: "nome", crescente: true };

// Função assíncrona que carrega os usuários da API
async function carregarUsuarios() {
  const resposta = await fetch("http://localhost:3000/list-users/1000");
  usuarios = await resposta.json();
  atualizarPaginacao(); 
}

// Função que compara duas strings, com ou sem normalização completa
function comparaStrings(a, b, fullCompare = true) {
  // Normaliza as strings para remover acentos e coloca em minúsculas
  const sa = a
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const sb = b
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  // Determina quantos caracteres serão comparados: todos ou apenas 3
  const len = fullCompare ? Math.max(sa.length, sb.length) : 3;

  // Compara caractere por caractere
  for (let i = 0; i < len; i++) {
    const c1 = sa.charCodeAt(i) || 0;
    const c2 = sb.charCodeAt(i) || 0;

    if (c1 < c2) return -1;
    if (c1 > c2) return 1;
  }

  // Se todos os caracteres comparados forem iguais
  return 0;
}

// Função de ordenação com o algoritmo da bolha
function bubbleSort(arr, key, crescente = true) {
  const tipo = typeof arr[0][key]; // Verifica se o campo é string ou número
  const n = arr.length;

  // Laços do algoritmo de ordenação da bolha
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      let a = arr[j][key];
      let b = arr[j + 1][key];

      // Usa comparação de strings ou números, dependendo do tipo
      let comp = tipo === "string" ? comparaStrings(a, b) : a - b;

      // Troca os elementos se estiverem fora da ordem desejada
      if ((crescente && comp > 0) || (!crescente && comp < 0)) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
}

// Função que ordena a tabela com base no campo clicado
function ordenarTabela(campo) {
  // Inverte a ordem se o mesmo campo for clicado novamente
  ordemAtual =
    ordemAtual.campo === campo
      ? { campo, crescente: !ordemAtual.crescente }
      : { campo, crescente: true };

  // Ordena o array de usuários
  bubbleSort(usuarios, ordemAtual.campo, ordemAtual.crescente);

  // Atualiza a tabela com os dados ordenados
  atualizarPaginacao();
}

// Atualiza os dados exibidos na página atual
function atualizarPaginacao() {
  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina); // Calcula o total de páginas

  // Garante que o número da página esteja dentro dos limites válidos
  paginaAtual = Math.max(1, Math.min(paginaAtual, totalPaginas));

  // Atualiza os elementos de interface que mostram os números de página
  document.getElementById("paginaAtual").innerText = paginaAtual;
  document.getElementById("totalPaginas").innerText = totalPaginas;

  // Define os índices de início e fim para o slice do array
  const inicio = (paginaAtual - 1) * usuariosPorPagina;
  const fim = inicio + usuariosPorPagina;

  // Renderiza apenas os usuários da página atual
  renderizarTabela(usuarios.slice(inicio, fim));
}

// Função chamada ao clicar em "Página Anterior"
function paginaAnterior() {
  paginaAtual--;
  atualizarPaginacao();
}

// Função chamada ao clicar em "Próxima Página"
function proximaPagina() {
  paginaAtual++;
  atualizarPaginacao();
}

// Função que desenha a tabela com os dados de usuários
function renderizarTabela(data) {
  const tbody = document.querySelector("#tabelaUsuarios tbody"); // Seleciona o corpo da tabela

  tbody.innerHTML = ""; // Limpa o conteúdo anterior da tabela

  // Insere uma linha HTML para cada usuário no array recebido
  data.forEach((u) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", u.id); 
    tr.innerHTML = `
      <td>${u.nome}</td>
      <td>${u.idade}</td>
      <td>${u.endereco}</td>
      <td>${u.email}</td>
      <td class="acoes">
        <a href="editar_usuario.html?id=${u.id}" class="btn-editar">
          <button class="editar-btn">Editar</button>
        </a>
        <button class="excluir-btn" data-id="${u.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Botões de exclusão
  document.querySelectorAll('.excluir-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const userId = this.getAttribute('data-id');
      deletarUsuario(userId);
    });
  });
}

// Função de exclusão 
async function deletarUsuario(userId) {
  try {
    const response = await fetch(`http://localhost:3000/deletar-usuario?id=${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || "Erro ao deletar usuário");
    }

    const data = await response.json();
    console.log("Sucesso:", data);

  
    const linha = document.querySelector(`tr[data-id="${userId}"]`);
    if (linha) linha.remove();

    // Atualiza o array e UI
    usuarios = usuarios.filter(u => u.id !== userId);
    atualizarPaginacao();

  } catch (error) {
    console.error("Erro completo:", error);
    alert(`Falha: ${error.message}`);
  }
  // Existe esta outra forma de iterar os elementos desse vetor de objetos:
  //  for(u of data){
  //       tbody.innerHTML += `
  //       <tr>
  //         <td>${u.nome}</td>
  //         <td>${u.idade}</td>
  //         <td>${u.endereco}</td>
  //         <td>${u.email}</td>
  //       </tr>`;
  // }
}

// Quando a página for carregada, executa a função que busca os usuários
window.onload = carregarUsuarios;
