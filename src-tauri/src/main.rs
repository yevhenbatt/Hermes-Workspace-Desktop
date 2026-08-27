// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use keyring::{Entry, Error as KeyringError};
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

const GATEWAY_TOKEN_SERVICE: &str = "com.hermes.workspace.desktop";
const GATEWAY_TOKEN_ACCOUNT: &str = "gateway-access-token";
const LOCAL_MATERIAL_PATH_SERVICE: &str = "com.hermes.workspace.desktop.local-materials";

fn gateway_token_entry() -> Result<Entry, String> {
    Entry::new(GATEWAY_TOKEN_SERVICE, GATEWAY_TOKEN_ACCOUNT)
        .map_err(|_| "Windows Credential Manager is unavailable".to_owned())
}

fn local_material_path_entry(source_id: &str) -> Result<Entry, String> {
    let source_id = Uuid::parse_str(source_id)
        .map_err(|_| "Invalid local material source identifier".to_owned())?
        .to_string();
    Entry::new(LOCAL_MATERIAL_PATH_SERVICE, &format!("source-path:{source_id}"))
        .map_err(|_| "Windows Credential Manager is unavailable".to_owned())
}

#[tauri::command]
fn store_gateway_access_token(access_token: String) -> Result<(), String> {
    if access_token.trim().is_empty() {
        return Err("Refusing to store an empty Gateway token".to_owned());
    }

    gateway_token_entry()?
        .set_password(&access_token)
        .map_err(|_| "Unable to store the Gateway session securely".to_owned())
}

#[tauri::command]
fn load_gateway_access_token() -> Result<Option<String>, String> {
    match gateway_token_entry()?.get_password() {
        Ok(access_token) => Ok(Some(access_token)),
        Err(KeyringError::NoEntry) => Ok(None),
        Err(_) => Err("Unable to read the stored Gateway session".to_owned()),
    }
}

#[tauri::command]
fn clear_gateway_access_token() -> Result<(), String> {
    match gateway_token_entry()?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(_) => Err("Unable to clear the stored Gateway session".to_owned()),
    }
}

#[tauri::command]
fn pick_local_material_source(app: tauri::AppHandle, source_type: String) -> Result<Option<String>, String> {
    let selection = match source_type.as_str() {
        "file" => app.dialog().file().blocking_pick_file(),
        "directory" | "obsidian_vault" => app.dialog().file().blocking_pick_folder(),
        _ => return Err("Unsupported local material source type".to_owned()),
    };

    Ok(selection.map(|path| path.to_string()))
}

#[tauri::command]
fn store_local_material_path(source_id: String, local_path: String) -> Result<(), String> {
    if !Path::new(&local_path).is_absolute() {
        return Err("Local material path must be absolute".to_owned());
    }
    local_material_path_entry(&source_id)?
        .set_password(&local_path)
        .map_err(|_| "Unable to store the local material path securely".to_owned())
}

#[tauri::command]
fn clear_local_material_path(source_id: String) -> Result<(), String> {
    match local_material_path_entry(&source_id)?.delete_credential() {
        Ok(()) | Err(KeyringError::NoEntry) => Ok(()),
        Err(_) => Err("Unable to clear the local material path".to_owned()),
    }
}

fn main() {
    // The Desktop shell exposes only the narrow keychain operations required for
    // the current Gateway access token. Local material access is added later via
    // explicit, user-selected capability scopes.
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            store_gateway_access_token,
            load_gateway_access_token,
            clear_gateway_access_token,
            pick_local_material_source,
            store_local_material_path,
            clear_local_material_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Hermes Workspace Desktop");
}
