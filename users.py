import ldap
import pymongo
from datetime import datetime
import tabulate

def connect_to_ldap(ldap_server, bind_dn, bind_password):
    """
    Establish connection to LDAP server
    """
    try:
        ldap_conn = ldap.initialize(ldap_server)
        ldap_conn.protocol_version = ldap.VERSION3
        ldap_conn.simple_bind_s(bind_dn, bind_password)
        return ldap_conn
    except ldap.LDAPError as e:
        print(f"LDAP Connection Error: {e}")
        return None

def fetch_ldap_users(ldap_conn, base_dn):
    """
    Fetch users from LDAP
    """
    try:
        search_filter = "(objectClass=user)"
        attributes = ['cn', 'mail', 'employeeID', 'department']
        
        results = ldap_conn.search_s(base_dn, ldap.SCOPE_SUBTREE, search_filter, attributes)
        
        users = []
        for dn, entry in results:
            user = {
                'name': entry.get('cn', [b''])[0].decode('utf-8'),
                'email': entry.get('mail', [b''])[0].decode('utf-8'),
                'employeeID': entry.get('employeeID', [b''])[0].decode('utf-8') if entry.get('employeeID') else '',
                'department': entry.get('department', [b''])[0].decode('utf-8') if entry.get('department') else ''
            }
            users.append(user)
        
        return users
    except ldap.LDAPError as e:
        print(f"LDAP Search Error: {e}")
        return []

def connect_to_mongodb(connection_string='mongodb://localhost:27017/'):
    """
    Establish connection to MongoDB
    """
    try:
        client = pymongo.MongoClient(connection_string)
        db = client['test']
        collection = db['users']
        return collection
    except Exception as e:
        print(f"MongoDB Connection Error: {e}")
        return None

def prepare_documents(users):
    """
    Prepare documents for MongoDB import
    """
    documents = []
    for user in users:
        document = {
            'name': user['name'],
            'email': user['email'],
            'employeeID': user.get('employeeID', ''),
            'department': user.get('department', ''),
            'mobile': '',  # Add mobile if available in LDAP
            'role': 'user',  # default role
            'active': True,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        documents.append(document)
    return documents

def preview_users(users):
    """
    Display a preview of users to be imported
    """
    # Prepare data for tabulation
    preview_data = []
    for user in users:
        preview_data.append([
            user.get('name', ''),
            user.get('email', ''),
            user.get('employeeID', ''),
            user.get('department', '')
        ])
    
    # Print preview using tabulate for nice formatting
    headers = ['Name', 'Email', 'Employee ID', 'Department']
    print("\n=== User Import Preview ===")
    print(tabulate.tabulate(preview_data, headers=headers, tablefmt='grid'))
    print(f"\nTotal users to import: {len(users)}")

def import_users_to_mongodb(documents, collection):
    """
    Import users to MongoDB
    """
    try:
        if documents:
            result = collection.insert_many(documents)
            print(f"Imported {len(result.inserted_ids)} users to MongoDB")
        else:
            print("No users to import")
    except Exception as e:
        print(f"MongoDB Import Error: {e}")

def main():
    # LDAP Connection Details
    LDAP_SERVER = 'ldap://195.1.107.121'
    BIND_DN = 'CN=Abhisek Paul,OU=Users,OU=Electro Steels Limited,DC=ESL01,DC=vedantaresource,DC=local'
    BIND_PASSWORD = '@Amul12345'
    BASE_DN = 'OU=Users,OU=Electro Steels Limited,DC=ESL01,DC=vedantaresource,DC=local'

    # Connect to LDAP
    ldap_conn = connect_to_ldap(LDAP_SERVER, BIND_DN, BIND_PASSWORD)
    if not ldap_conn:
        return

    # Fetch users from LDAP
    users = fetch_ldap_users(ldap_conn, BASE_DN)
    
    # Close LDAP connection
    ldap_conn.unbind_s()

    # Preview users
    preview_users(users)

    # Ask for confirmation
    confirm = input("\nDo you want to proceed with importing these users? (yes/no): ").lower().strip()
    
    if confirm == 'yes':
        # Connect to MongoDB
        collection = connect_to_mongodb()
        if not collection:
            return

        # Prepare documents
        documents = prepare_documents(users)

        # Import users to MongoDB
        import_users_to_mongodb(documents, collection)
    else:
        print("User import cancelled.")

if __name__ == '__main__':
    main()