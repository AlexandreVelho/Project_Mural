const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.uploadFile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Método não permitido");
    }

    const {file, name} = req.body;
    const bucket = admin.storage().bucket();

    const directory = "files"; // Diretório para armazenar arquivos
    const fileRef = bucket.file(`${directory}/${name}`); // Caminho do arquivo

    try {
      await fileRef.save(Buffer.from(file, "base64"));

      const options = {
        action: "read",
        expires: "03-01-2500",
      };

      const publicUrl = await fileRef.getSignedUrl(options);
      res.status(200).send(publicUrl); // Retorna a URL do arquivo
    } catch (error) {
      res.status(500).send(error.toString());
    }
  });
});
