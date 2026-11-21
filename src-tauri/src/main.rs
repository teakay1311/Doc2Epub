use std::{io::Write, path::Path};

use tauri::ipc::{InvokeBody, Request};
use tauri_plugin_dialog::DialogExt;

fn write_epub(path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    use std::io::{Error, ErrorKind};

    let parent = path
        .parent()
        .ok_or_else(|| Error::from(ErrorKind::InvalidInput))?;
    let replace = match path.symlink_metadata() {
        Ok(metadata) if metadata.is_file() => true,
        Ok(_) => {
            return Err(Error::new(
                ErrorKind::InvalidInput,
                "Destination is not a regular file",
            ))
        }
        Err(error) if error.kind() == ErrorKind::NotFound => false,
        Err(error) => return Err(error),
    };
    let mut temporary = tempfile::NamedTempFile::new_in(parent)?;
    temporary.write_all(bytes)?;
    temporary.as_file().sync_all()?;
    if replace {
        temporary.persist(path)?;
    } else {
        temporary.persist_noclobber(path)?;
    }
    Ok(())
}

#[tauri::command]
async fn save_epub(window: tauri::WebviewWindow, request: Request<'_>) -> Result<bool, String> {
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("Missing EPUB data".into());
    };
    if !bytes.starts_with(b"PK\x03\x04") {
        return Err("Invalid EPUB archive".into());
    }
    let encoded_name = request
        .headers()
        .get("x-epub-filename")
        .and_then(|value| value.to_str().ok())
        .ok_or("Missing EPUB filename")?;
    let filename = percent_encoding::percent_decode_str(encoded_name)
        .decode_utf8()
        .map_err(|error| error.to_string())?
        .into_owned();
    let suggested = Path::new(&filename);
    if suggested.file_name().and_then(|name| name.to_str()) != Some(filename.as_str()) {
        return Err("Invalid EPUB filename".into());
    }

    let bytes = bytes.clone();
    let title = if request
        .headers()
        .get("x-app-language")
        .is_some_and(|value| value == "vi")
    {
        "Lưu sách EPUB"
    } else {
        "Save EPUB"
    };

    tauri::async_runtime::spawn_blocking(move || {
        let selected = window
            .dialog()
            .file()
            .set_title(title)
            .set_parent(&window)
            .set_file_name(filename)
            .add_filter("EPUB", &["epub"])
            .blocking_save_file();
        let Some(selected) = selected else {
            return Ok(false);
        };
        let path = selected.into_path().map_err(|error| error.to_string())?;
        if !path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("epub"))
        {
            return Err("The filename must end in .epub".into());
        }
        write_epub(&path, &bytes).map_err(|error| {
            if error.kind() == std::io::ErrorKind::PermissionDenied {
                "SAVE_PERMISSION_DENIED".into()
            } else {
                error.to_string()
            }
        })?;
        Ok(true)
    })
    .await
    .map_err(|error| error.to_string())?
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![save_epub])
        .run(tauri::generate_context!())
        .expect("failed to run Doc2EPUB");
}

#[cfg(test)]
mod tests {
    use super::write_epub;

    #[test]
    fn writes_and_replaces_only_regular_files() {
        let folder = tempfile::tempdir().unwrap();
        let path = folder.path().join("book.epub");
        write_epub(&path, b"first").unwrap();
        write_epub(&path, b"second").unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"second");

        let symlink = folder.path().join("link.epub");
        std::os::unix::fs::symlink(&path, &symlink).unwrap();
        assert!(write_epub(&symlink, b"replacement").is_err());
        assert!(write_epub(folder.path(), b"replacement").is_err());
        assert_eq!(std::fs::read(&path).unwrap(), b"second");
        assert_eq!(std::fs::read_dir(folder.path()).unwrap().count(), 2);
    }
}
