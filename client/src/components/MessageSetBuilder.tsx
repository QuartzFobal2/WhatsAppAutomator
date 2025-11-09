import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import {
  Image,
  Paperclip,
  Mic,
  Video,
  Plus,
  X,
  GripVertical,
} from "lucide-react";

export type MessageItem = {
  id: string;
  type: "text" | "image" | "file" | "audio" | "video";
  content: string;
  fileName?: string;
  base64Data?: string;
};

type MessageSetBuilderProps = {
  onSave?: (name: string, messages: MessageItem[]) => void;
};

export function MessageSetBuilder({ onSave }: MessageSetBuilderProps) {
  const { toast } = useToast();
  const [setName, setSetName] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    { id: "1", type: "text", content: "" },
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const addMessage = (type: MessageItem["type"]) => {
    const newMessage: MessageItem = {
      id: Date.now().toString(),
      type,
      content: type === "text" ? "" : "",
      fileName: undefined,
      base64Data: undefined,
    };
    setMessages([...messages, newMessage]);
  };

  const updateMessage = (id: string, content: string) => {
    setMessages(messages.map((m) => (m.id === id ? { ...m, content } : m)));
    // Clear error for this message
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const updateMessageFile = (id: string, fileName: string, base64Data: string) => {
    setMessages(messages.map((m) => (
      m.id === id ? { ...m, fileName, base64Data } : m
    )));
    // Clear error for this message
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const removeMessageFile = (id: string) => {
    setMessages(messages.map((m) => (
      m.id === id ? { ...m, fileName: undefined, base64Data: undefined } : m
    )));
  };

  const removeMessage = (id: string) => {
    setMessages(messages.filter((m) => m.id !== id));
    // Clear error for this message
    const newErrors = { ...errors };
    delete newErrors[id];
    setErrors(newErrors);
  };

  const validateMessages = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!setName || setName.trim().length === 0) {
      newErrors['setName'] = 'Nome do conjunto é obrigatório';
    }

    if (messages.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos uma mensagem",
        variant: "destructive",
      });
      return false;
    }

    messages.forEach((msg) => {
      if (msg.type === 'text') {
        if (!msg.content || msg.content.trim().length === 0) {
          newErrors[msg.id] = 'Mensagem de texto não pode estar vazia';
        }
      } else {
        if (!msg.base64Data && !msg.fileName) {
          newErrors[msg.id] = 'Selecione um arquivo';
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros antes de salvar",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (!validateMessages()) {
      return;
    }

    if (onSave && setName) {
      onSave(setName, messages);
      toast({
        title: "Sucesso",
        description: `Conjunto "${setName}" salvo com sucesso`,
      });
      // Reset form
      setSetName("");
      setMessages([{ id: Date.now().toString(), type: "text", content: "" }]);
      setErrors({});
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Message Set</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="set-name">Message Set Name</Label>
          <Input
            id="set-name"
            placeholder="e.g., Weekly Newsletter, Product Launch"
            value={setName}
            onChange={(e) => {
              setSetName(e.target.value);
              const newErrors = { ...errors };
              delete newErrors['setName'];
              setErrors(newErrors);
            }}
            data-testid="input-message-set-name"
            className={errors['setName'] ? 'border-destructive' : ''}
          />
          {errors['setName'] && (
            <p className="text-sm text-destructive">{errors['setName']}</p>
          )}
        </div>

        <div className="space-y-4">
          <Label>Messages</Label>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="flex gap-2 items-start p-4 border rounded-md bg-card"
              data-testid={`message-item-${message.id}`}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {message.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Message {index + 1}
                  </span>
                </div>
                {message.type === "text" ? (
                  <div>
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={message.content}
                      onChange={(e) => updateMessage(message.id, e.target.value)}
                      className={`min-h-[80px] ${errors[message.id] ? 'border-destructive' : ''}`}
                      data-testid={`input-message-content-${message.id}`}
                    />
                    {errors[message.id] && (
                      <p className="text-sm text-destructive mt-1">{errors[message.id]}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <FileUpload
                      type={message.type}
                      onFileSelect={(file, base64) => {
                        updateMessageFile(message.id, file.name, base64);
                      }}
                      onFileRemove={() => removeMessageFile(message.id)}
                      currentFile={message.fileName ? {
                        fileName: message.fileName,
                        base64Data: message.base64Data,
                      } : undefined}
                    />
                    {message.content && (
                      <div className="mt-2">
                        <Label className="text-xs">Legenda (opcional)</Label>
                        <Input
                          placeholder="Adicione uma legenda..."
                          value={message.content}
                          onChange={(e) => updateMessage(message.id, e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                    {errors[message.id] && (
                      <p className="text-sm text-destructive mt-1">{errors[message.id]}</p>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMessage(message.id)}
                data-testid={`button-remove-message-${message.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addMessage("text")}
            data-testid="button-add-text"
          >
            <Plus className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addMessage("image")}
            data-testid="button-add-image"
          >
            <Image className="h-4 w-4 mr-2" />
            Image
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addMessage("file")}
            data-testid="button-add-file"
          >
            <Paperclip className="h-4 w-4 mr-2" />
            File
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addMessage("audio")}
            data-testid="button-add-audio"
          >
            <Mic className="h-4 w-4 mr-2" />
            Audio
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addMessage("video")}
            data-testid="button-add-video"
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" data-testid="button-cancel">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-message-set">
            Save Message Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
