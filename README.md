SIGA Report Watcher
===================

Watch *.rdlc changes and automatically updates them in the database.

#### Install

`npm install -g binderplus/siga-report-watcher`

It will install directly from git repository, since this isn't worth publishing to npm.

#### Configuration

Create a config file that contains mapping information from rdlc files to database records.

Example: (https://github.com/binderplus/siga-report-watcher/blob/master/config.json)

```js
{
	"path": "C:/Users/User/Dropbox/Iván/Programación/Personlización SiGA/Reportes SIGA",
	"files": [
		"BINDERPLUS.Comprobante.rdlc",
		"BINDERPLUS.Comprobante.X.rdlc",
		"BINDERPLUS.Presupuesto.X.rdlc",
		"BINDERPLUS.Recibo.rdlc",
		"BINDERPLUS.Recibo.X.rdlc",
		"BINDERPLUS.RemitoTransporte.rdlc",
		"Eniac.Win.Pago.rdlc",
		{ "source": "Eniac.Win.Pago.X.rdlc",
		  "output": "Eniac.Win.PagoProvisorio.rdlc" },
		"Eniac.Win.Retencion.rdlc",
		{ "source": "Eniac.Win.ConsultarCtaCteClientes.rdlc", "output": [
			"Eniac.Win.ConsultarCtaCteClientes.rdlc",
			"Eniac.Win.ConsultarCtaCteClientesPorVendedor.rdlc"
		] }
	]
}
```

- `path` is the base path every file will be relative to.
- `files` is an array of mapping information, containing a single `source` (filename) and an array of row names as `output`.
If only a `string` is supplied, it will assume `source` and `output` are the same.

#### Usage

`siga-report-watcher --c ./config.json --u SQLEXPRESS_USERNAME --p SQLEXPRESS_PASSWORD`

It will automatically watch for file changes and update the database.

```Options:
  -c, --config    Configuration file.      [default: "./config.json"]
  -u, --username  Database Username        [required]
  -p, --password  Database Password        [required]
  -s, --server    Database Server Address  [default: "localhost"]
  -i, --instance  Database Instance Name   [default: "SQLExpress"]
  -d, --database  Database Name            [default: "SIGA"]
  -t, --table     Database Table           [default: "ArchivosAImprimir"]
```

#### Comments

This software is designed specifically to work with SIGA, software by http://www.sinergiass.com.ar/

We are in no way related to them.
