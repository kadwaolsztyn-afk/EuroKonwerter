Dim objShell, appUrl, edgePath32, edgePath64, chromePath, fso

Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appUrl = "https://ais-dev-q6icxcakcnvkud2eyjq3fr-175691408196.europe-west2.run.app"
edgePath32 = objShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
edgePath64 = objShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe"
chromePath = objShell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Google\Chrome\Application\chrome.exe"

If fso.FileExists(edgePath32) Then
    objShell.Run """" & edgePath32 & """ --app=" & appUrl, 1, False
ElseIf fso.FileExists(edgePath64) Then
    objShell.Run """" & edgePath64 & """ --app=" & appUrl, 1, False
ElseIf fso.FileExists(chromePath) Then
    objShell.Run """" & chromePath & """ --app=" & appUrl, 1, False
Else
    objShell.Run appUrl, 1, False
End If
