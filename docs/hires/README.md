# Agent role manifests

Portable agent templates retained for import into Casa da Índia. The former gallery
website has been removed; the JSON manifests and their format remain available.

Import a file from `manifests/` through **Add agent → import hire**, review its fields,
and then create the agent. See the [manifest specification](spec/HIRE_SPEC.md).

To add a template, create `manifests/<slug>.hire.json` and add its filename to
`manifests/index.json`. Run `python3 scripts/build-data.py` from this directory to
regenerate the provider variants. `models.json` retains the model suggestion data;
`--sync-models` optionally refreshes it from upstream.
