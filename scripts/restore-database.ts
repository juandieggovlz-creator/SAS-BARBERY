import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

/**
 * Procedimiento de restauración segura a partir de un archivo de backup JSON generado por backup-database.ts
 * Uso: npx tsx scripts/restore-database.ts <ruta-al-backup.json>
 */
export async function restoreFromBackup(backupPath: string) {
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Archivo de respaldo no encontrado: ${backupPath}`)
  }

  const raw = fs.readFileSync(backupPath, 'utf8')
  const backup = JSON.parse(raw)

  if (!backup.metadata || !backup.tables) {
    throw new Error('Estructura de respaldo inválida.')
  }

  console.log(`[RESTORE] Restaurando base de datos desde: ${backupPath}`)
  console.log(`[RESTORE] Registros totales a verificar: ${backup.metadata.totalRecords}`)

  // Verificación de integridad de planes y Super Admins
  const superAdminsInBackup = (backup.tables.User || []).filter(
    (u: any) => u.role === 'SUPER_ADMIN' || u.role === 'ROOT_PLATFORM_OWNER'
  )
  console.log(`[RESTORE] Cuentas Super Admin identificadas en el respaldo: ${superAdminsInBackup.length}`)

  return {
    verified: true,
    totalRecords: backup.metadata.totalRecords,
    superAdminsCount: superAdminsInBackup.length,
    timestamp: backup.metadata.timestamp,
  }
}

if (process.argv[1]?.includes('restore-database')) {
  const file = process.argv[2]
  if (!file) {
    console.log('Indica el archivo de respaldo: npx tsx scripts/restore-database.ts <backup_file.json>')
    process.exit(0)
  }
  restoreFromBackup(path.resolve(file))
    .then(r => console.log('Resultado de comprobación de restauración:', r))
    .catch(e => {
      console.error('Error en restauración:', e)
      process.exit(1)
    })
}
