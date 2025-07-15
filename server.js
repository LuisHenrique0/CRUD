// Importa os módulos necessários
const express = require("express"); // Framework para criação de aplicações web
const cors = require("cors"); // Middleware para permitir requisições entre domínios (Cross-Origin)
const path = require("path"); // Módulo para lidar com caminhos de arquivos de forma segura
const fs = require("fs"); // Módulo para manipulação de arquivos do sistema
const { v4: uuidv4 } = require("uuid");

const ARQUIVO = "usuarios.json";

// Inicializa o app Express
const app = express();

// Define o endereço e porta em que o servidor vai escutar
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;

app.use(express.json()); //ativa parser JSON para este projeto
app.use(express.urlencoded({ extended: true }));
// Configura o Express para servir arquivos estáticos da pasta "public"
// Isso permite acessar arquivos como index.html diretamente
app.use(express.static(path.join(__dirname, "public")));

// Ativa o CORS para permitir chamadas HTTP de outras origens (por exemplo, frontend em outro servidor)
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
// Para logs, retornando data,hora e etc junto do método e da url
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * Função que lê o arquivo usuarios.json e retorna até 'qtd' usuários
 * Se houver erro na leitura, retorna um array vazio
 */
function lerUsuarios(max=0) {
  try {
    const dados = fs.readFileSync("usuarios.json", "utf-8"); // Lê o conteúdo do arquivo
    const usuarios = JSON.parse(dados); // Converte a string JSON em array de objetos
    let algunsUsuarios = [];

    if (max === 0) {
      max = usuarios.length;
    }

    for (let cont = 0; cont < max; cont++) {
      algunsUsuarios[cont] = usuarios[cont];
    }

    return algunsUsuarios;
  } catch (erro) {
    // Em caso de erro (arquivo ausente ou malformado), exibe no console e retorna array vazio
    console.error("Erro ao ler o arquivo usuarios.json:", erro);
    return [];
  }
}

let usuarios = lerUsuarios();
/**
 * Salva o Array de usuários passado como argumento, para um arquivo JSON.
 *
 * Args:
 *   usuarios (Array): Array de Objetos.
 */
function salvarUsuarios(usuarios) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(usuarios, null, 2), "utf8");
}

// Rota principal ("/")
// Envia o arquivo index.html que está na pasta "public"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public") + "index.html");
});

app.post("/cadastrar-usuario", (req, res) => {
  console.log(usuarios.length);

  const novoUsuario = {
    id: uuidv4(),
    nome: req.body.nome,
    idade: req.body.idade,
    endereco: req.body.endereco,
    email: req.body.email,
  };
  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);
  //res.status(200);
  res.status(201).json({
    ok: true,
    message: "Usuário cadastrado com sucesso!",
    usuario: novoUsuario,
  });
});

// Rota "/list-users/:count?"
// Retorna um JSON com até 'count' usuários do arquivo usuarios.json
app.get("/list-users/:count?", (req, res) => {
  let num = parseInt(req.params.count); // Lê o parâmetro :count e converte para número

  // Define valor padrão e limites de segurança
  // if (isNaN(num)) num=100;
  // if (num < 100) num = 100;
  // if (num > 100_000) num = 100_000;
  console.log(num);
  // Envia os usuários lidos como resposta JSON
  res.json(lerUsuarios(num));
});

// Rota para obter um usuário específico(get, necessário para o update e delete)
app.get("/obter-usuario", (req, res) => {
  const userId = req.query.id;
  const usuario = usuarios.find(u => u.id === userId);
  
  if (usuario) {
    res.json({
      ok: true,
      usuario: usuario
    });
  } else {
    res.status(404).json({
      ok: false,
      message: "Usuário não encontrado"
    });
  }
});

// Editar usuário
app.put("/editar-usuario", (req, res) => {
  const userId = req.body.id;
  const index = usuarios.findIndex(u => u.id === userId);
  
  if (index !== -1) {
    usuarios[index] = {
      ...usuarios[index],
      nome: req.body.nome,
      idade: req.body.idade,
      endereco: req.body.endereco,
      email: req.body.email
    };
    
    salvarUsuarios(usuarios);
    
    res.json({
      ok: true,
      message: "Usuário atualizado com sucesso!",
      usuario: usuarios[index]
    });
  } else {
    res.status(404).json({
      ok: false,
      message: "Usuário não encontrado"
    });
  }
});


// Deletar usuário
app.delete("/deletar-usuario", (req, res) => {
  try {
    if (!req.query.id) {
      return res.status(400).json({ error: "ID não fornecido" });
    }

    const userId = req.query.id;

    usuarios = lerUsuarios();
    const index = usuarios.findIndex(u => u.id === userId);

    if (index === -1) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    usuarios.splice(index, 1);
    salvarUsuarios(usuarios);

    return res.json({ success: true, message: "Usuário deletado com sucesso!" });

  } catch (error) {
    console.error("❌ Erro:", error.message);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


app.use((req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Rota não encontrada" });
});

// Inicia o servidor e exibe a URL no console
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
});
