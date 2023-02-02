use std::{fs::read_to_string, path::PathBuf};

use miette::{miette, IntoDiagnostic, Result};
use tera::{Context, Tera};

use crate::utils::{build_in_memory_database, find_hcl_files};

pub fn command(template_path: PathBuf, path: PathBuf, episode_name: String) -> Result<()> {
    if !template_path.is_file() {
        return Err(miette!(
            "Template path {} is not a file",
            template_path.display()
        ));
    }

    let template = read_to_string(template_path).into_diagnostic()?;

    let files = find_hcl_files(path)?;

    let database = build_in_memory_database(files)?;

    let episode = database
        .episodes
        .get(&episode_name)
        .ok_or_else(|| miette!("Episode {} not found in database", episode_name))?;

    let mut context = Context::new();
    context.insert("episode", &episode);

    let template_output = Tera::one_off(&template, &context, false).into_diagnostic()?;

    println!("{template_output}");

    Ok(())
}
