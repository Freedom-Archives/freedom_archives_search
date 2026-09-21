import Help from "@mui/icons-material/Help";
import PasswordIcon from "@mui/icons-material/Password";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { startCase } from "lodash-es";
import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "src/stores";
import { checkUnique } from "src/utils";

import { users as usersService } from "../api";

import ChangePassword from "./ChangePassword";

const EditableDataTable = lazy(() => import("../components/EditableDataTable"));

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { user } = useAuth();

  const [editPassword, setEditPassword] = useState({
    open: false,
    user: { username: "intern", user_id: 5 },
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const query = {
      $sort: { username: 1 },
      active: showInactive ? undefined : true,
      $limit: 1000,
    };
    const { data: users } = await usersService.find({ query });
    setUsers(users);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => {
    fetchUsers(showInactive);
  }, [fetchUsers, showInactive]);

  const columns = useMemo(
    () =>
      [
        {
          field: "username",
          flex: 2,
          editable: true,
          preProcessEditCellProps: async (params) => {
            const hasError = await checkUnique("users", {
              username: params.props.value,
              user_id: { $ne: params.props?.row?.user_id },
            });
            const result = {
              ...params.props,
              error: hasError ? `An user named "${params.props.value}" already exists` : null,
            };
            return result;
          },
        },
        {
          field: "firstname",
          flex: 2,
          editable: true,
        },
        {
          field: "lastname",
          flex: 2,
          editable: true,
        },
        {
          field: "email",
          flex: 2,
          editable: true,
        },
        {
          field: "role",
          flex: 1,
          editable: true,
          type: "singleSelect",
          valueOptions: ["intern", "staff", "administrator"],
          valueFormatter: (value) => startCase(value),
          getOptionLabel: (value) => startCase(value),
          headerName: (
            <Stack direction="row" alignItems="baseline" spacing={1} useFlexGap>
              <span>Roles</span>
              <Tooltip
                arrow
                title={
                  <Box>
                    <Typography variant="caption" component="ul" sx={{ p: 1, pl: 2 }}>
                      <li>
                        <b>Intern</b>: Can modify collections and records
                      </li>
                      <li>
                        <b>Staff</b>: Can modify site settings, featured records and collections, list items
                      </li>
                      <li>
                        <b>Administrator</b>: Can publish site and review changes, and manage users
                      </li>
                    </Typography>
                  </Box>
                }
              >
                <Help fontSize="inherit" />
              </Tooltip>
            </Stack>
          ),
        },
        {
          field: "active",
          flex: 1,
          type: "boolean",
          editable: true,
        },
      ].map((col) => {
        col.disableColumnMenu = true;
        return col;
      }),
    [],
  );

  const extraActions = useMemo(
    () => [["Change Password", PasswordIcon, (user) => setEditPassword({ open: true, user })]],
    [],
  );

  const defaultValues = {
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    role: "intern",
    active: true,
  };

  const headerControls = [
    <FormControl key="active_toggle" onChange={() => setShowInactive((prev) => !prev)}>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox name="active" size="x-small" checked={showInactive} sx={{ py: 0 }} />}
          label={"Show Inactive"}
        />
      </FormGroup>
    </FormControl>,
  ];

  return (
    <Paper className="users flex-container" sx={{ p: 0 }}>
      <EditableDataTable
        {...{
          rows: users,
          columns,
          loading,
          defaultValues,
          onUpdate: fetchUsers,
          idField: "user_id",
          onNew: (row) => {
            setEditPassword({ open: true, user: row });
          },
          isCellEditable: (params) =>
            (params.field !== "username" || params.row.user_id === -1) &&
            (params.row.user_id !== user.user_id || !["role", "active"].includes(params.field)),
        }}
        extraActions={extraActions}
        disableDelete
        model="users"
        itemType="User"
        nameField="username"
        getItemName={(row) => row.username}
        autosizeColumns
        headerControls={headerControls}
      />
      <ChangePassword
        {...editPassword}
        handleClose={() => {
          setEditPassword({ open: false, user: {} });
          fetchUsers();
        }}
      />
    </Paper>
  );
}
